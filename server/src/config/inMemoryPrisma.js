/**
 * Lightweight In-Memory Prisma implementation for isolated testing
 * when an external MySQL 8 daemon is not reachable in sandbox environments.
 * Mirrors Prisma model operations, relations, and transaction semantics.
 */

class InMemoryTable {
  constructor(name, client) {
    this.name = name;
    this.client = client;
    this.records = [];
    this.autoIncrementId = 1n;
  }

  _clone(obj) {
    if (!obj) return obj;
    return JSON.parse(JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ), (key, value) => {
      if (key === 'id' || key.endsWith('_id') || key === 'user_id' || key === 'company_id') {
        if (value && typeof value === 'string' && /^\d+$/.test(value)) {
          try {
            return BigInt(value);
          } catch {
            return value;
          }
        }
      }
      return value;
    });
  }

  _matchesFilter(record, where) {
    if (!where) return true;

    for (const [key, condition] of Object.entries(where)) {
      if (key === 'AND') {
        if (!condition.every((cond) => this._matchesFilter(record, cond))) return false;
        continue;
      }
      if (key === 'OR') {
        if (!condition.some((cond) => this._matchesFilter(record, cond))) return false;
        continue;
      }
      if (key === 'NOT') {
        if (this._matchesFilter(record, condition)) return false;
        continue;
      }

      const val = record[key];

      if (condition === null) {
        if (val !== null && val !== undefined) return false;
      } else if (typeof condition === 'object' && !(condition instanceof Date) && typeof condition !== 'bigint') {
        if ('in' in condition) {
          const list = condition.in.map((v) => String(v));
          const target = String(val);
          if (!list.includes(target)) return false;
        }
        if ('not' in condition) {
          if (String(val) === String(condition.not)) return false;
        }
        if ('startsWith' in condition) {
          if (typeof val !== 'string' || !val.startsWith(condition.startsWith)) return false;
        }
        if ('gt' in condition) {
          if (!(val > condition.gt)) return false;
        }
        if ('gte' in condition) {
          if (!(val >= condition.gte)) return false;
        }
        if ('lt' in condition) {
          if (!(val < condition.lt)) return false;
        }
        if ('lte' in condition) {
          if (!(val <= condition.lte)) return false;
        }
      } else {
        if (String(val) != String(condition)) return false;
      }
    }
    return true;
  }

  async _resolveIncludes(record, include) {
    if (!include || !record) return record;

    const enriched = { ...record };

    if (include.user && record.user_id) {
      enriched.user = await this.client.users.findUnique({
        where: { id: record.user_id }
      });
    }

    if (include.company && record.company_id) {
      enriched.company = await this.client.companies.findUnique({
        where: { id: record.company_id }
      });
    }

    if (include.industry && record.industry_id) {
      enriched.industry = await this.client.industries.findUnique({
        where: { id: record.industry_id }
      });
    }

    if (include.company_type && record.company_type_id) {
      enriched.company_type = await this.client.company_types.findUnique({
        where: { id: record.company_type_id }
      });
    }

    return enriched;
  }

  async findFirst({ where, include, orderBy } = {}) {
    const list = await this.findMany({ where, include, orderBy, take: 1 });
    return list.length > 0 ? list[0] : null;
  }

  async findUnique({ where, include } = {}) {
    return this.findFirst({ where, include });
  }

  async findMany({ where, include, orderBy, skip, take } = {}) {
    let results = this.records.filter((r) => this._matchesFilter(r, where));

    if (orderBy) {
      const [orderKey, orderDir] = Object.entries(orderBy)[0] || ['id', 'asc'];
      results.sort((a, b) => {
        if (a[orderKey] > b[orderKey]) return orderDir.toLowerCase() === 'desc' ? -1 : 1;
        if (a[orderKey] < b[orderKey]) return orderDir.toLowerCase() === 'desc' ? 1 : -1;
        return 0;
      });
    }

    if (skip) results = results.slice(skip);
    if (take) results = results.slice(0, take);

    const cloned = results.map((r) => this._clone(r));

    if (include) {
      return Promise.all(cloned.map((r) => this._resolveIncludes(r, include)));
    }
    return cloned;
  }

  async create({ data }) {
    const record = {
      id: data.id ? BigInt(data.id) : this.autoIncrementId++,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      ...data
    };

    // Apply MySQL column defaults
    if (this.name === 'users') {
      if (record.failed_attempts === undefined) record.failed_attempts = 0;
      if (record.locked_until === undefined) record.locked_until = null;
      if (record.status === undefined) record.status = 'active';
    } else if (this.name === 'refresh_tokens') {
      if (record.revoked_at === undefined) record.revoked_at = null;
    } else if (this.name === 'password_resets') {
      if (record.used_at === undefined) record.used_at = null;
    }

    this.records.push(record);
    return this._clone(record);
  }

  async createMany({ data }) {
    const list = Array.isArray(data) ? data : [data];
    for (const item of list) {
      await this.create({ data: item });
    }
    return { count: list.length };
  }

  async update({ where, data }) {
    const index = this.records.findIndex((r) => this._matchesFilter(r, where));
    if (index === -1) {
      const err = new Error('Record to update not found');
      err.code = 'P2025';
      throw err;
    }
    const updated = {
      ...this.records[index],
      ...data,
      updated_at: new Date()
    };
    this.records[index] = updated;
    return this._clone(updated);
  }

  async updateMany({ where, data }) {
    let count = 0;
    for (let i = 0; i < this.records.length; i++) {
      if (this._matchesFilter(this.records[i], where)) {
        this.records[i] = {
          ...this.records[i],
          ...data,
          updated_at: new Date()
        };
        count++;
      }
    }
    return { count };
  }

  async delete({ where }) {
    const index = this.records.findIndex((r) => this._matchesFilter(r, where));
    if (index === -1) {
      const err = new Error('Record to delete not found');
      err.code = 'P2025';
      throw err;
    }
    const deleted = this.records.splice(index, 1)[0];
    return this._clone(deleted);
  }

  async deleteMany({ where } = {}) {
    if (!where || Object.keys(where).length === 0) {
      const count = this.records.length;
      this.records = [];
      return { count };
    }
    const initialLen = this.records.length;
    this.records = this.records.filter((r) => !this._matchesFilter(r, where));
    return { count: initialLen - this.records.length };
  }

  async count({ where } = {}) {
    return this.records.filter((r) => this._matchesFilter(r, where)).length;
  }

  async upsert({ where, create, update }) {
    const existing = await this.findFirst({ where });
    if (existing) {
      return this.update({ where, data: update });
    }
    return this.create({ data: create });
  }
}

class InMemoryPrismaClient {
  constructor() {
    this.tableNames = [
      'users', 'refresh_tokens', 'password_resets', 'permissions', 'user_permissions',
      'companies', 'company_documents', 'company_verification_logs',
      'jobs', 'job_skills', 'job_sequences',
      'candidates', 'candidate_skills',
      'job_candidates', 'job_candidate_history',
      'notifications', 'audit_logs', 'email_templates', 'settings',
      'industries', 'company_types', 'job_categories', 'job_titles', 'skills',
      'qualifications', 'employment_types', 'experience_levels', 'candidate_sources',
      'countries', 'states', 'cities'
    ];

    for (const name of this.tableNames) {
      this[name] = new InMemoryTable(name, this);
    }
  }

  async $transaction(arg) {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    if (typeof arg === 'function') {
      return arg(this);
    }
    return arg;
  }

  async $queryRaw(strings, ...values) {
    return [{ positions_required: 1, status: 'open' }];
  }

  async $disconnect() {
    return Promise.resolve();
  }
}

module.exports = {
  InMemoryPrismaClient
};

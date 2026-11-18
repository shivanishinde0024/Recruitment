'use client';

import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function LocationCascade({
  countryId,
  stateId,
  cityId,
  onChange,
  required = false
}) {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    api.get('/masters/countries?limit=300&isActive=true')
      .then((res) => setCountries(res.data?.data || []))
      .catch((err) => console.error('Failed to load countries:', err));
  }, []);

  useEffect(() => {
    if (countryId) {
      api.get(`/masters/states?limit=300&isActive=true&parentId=${countryId}`)
        .then((res) => setStates(res.data?.data || []))
        .catch((err) => console.error('Failed to load states:', err));
    } else {
      setStates([]);
      setCities([]);
    }
  }, [countryId]);

  useEffect(() => {
    if (stateId) {
      api.get(`/masters/cities?limit=500&isActive=true&parentId=${stateId}`)
        .then((res) => setCities(res.data?.data || []))
        .catch((err) => console.error('Failed to load cities:', err));
    } else {
      setCities([]);
    }
  }, [stateId]);

  return (
    <div className="row g-2">
      <div className="col-md-4">
        <label className="form-label small fw-semibold">Country {required && <span className="text-danger">*</span>}</label>
        <select
          className="form-select form-select-sm"
          value={countryId || ''}
          onChange={(e) => onChange({ countryId: e.target.value ? Number(e.target.value) : null, stateId: null, cityId: null })}
          required={required}
        >
          <option value="">Select Country</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="col-md-4">
        <label className="form-label small fw-semibold">State {required && <span className="text-danger">*</span>}</label>
        <select
          className="form-select form-select-sm"
          value={stateId || ''}
          onChange={(e) => onChange({ countryId, stateId: e.target.value ? Number(e.target.value) : null, cityId: null })}
          disabled={!countryId || states.length === 0}
          required={required}
        >
          <option value="">Select State</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="col-md-4">
        <label className="form-label small fw-semibold">City {required && <span className="text-danger">*</span>}</label>
        <select
          className="form-select form-select-sm"
          value={cityId || ''}
          onChange={(e) => onChange({ countryId, stateId, cityId: e.target.value ? Number(e.target.value) : null })}
          disabled={!stateId || cities.length === 0}
          required={required}
        >
          <option value="">Select City</option>
          {cities.map((ci) => (
            <option key={ci.id} value={ci.id}>{ci.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

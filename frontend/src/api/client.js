const API_BASE = "http://localhost:3000";

export async function predictTelco(data, token) {

  const res = await fetch(`${API_BASE}/telco/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error("Prediction failed");
  }

  return res.json();
}

export async function getDashboardSummary(token) {

  const res = await fetch(`${API_BASE}/telco/dashboard/summary`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  return res.json();
}

export async function getDashboardDistribution(token) {

  const res = await fetch(`${API_BASE}/telco/dashboard/distribution`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  return res.json();
}

export async function getDashboardTop(token) {

  const res = await fetch(`${API_BASE}/telco/dashboard/top`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  return res.json();
}

export async function getFeatureImportance(token) {
  const res = await fetch(`${API_BASE}/telco/dashboard/feature-importance`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Feature importance failed");
  }

  return res.json();
}

export async function getCustomers(token, filters = {}) {

  const params = new URLSearchParams(filters);

  const res = await fetch(
    `${API_BASE}/telco/customers?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!res.ok) {
    throw new Error("Customers request failed");
  }

  return res.json();
}
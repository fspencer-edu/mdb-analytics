import { useEffect, useMemo, useState } from "react";
import RentTrendChart from "./components/RentTrendChart";

const API_BASE = "http://localhost:5001/api";

export default function App() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [trendData, setTrendData] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [etlLoading, setEtlLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchInitialData() {
    try {
      const [citiesRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/cities`),
        fetch(`${API_BASE}/summary`)
      ]);

      const citiesData = await citiesRes.json();
      const summaryData = await summaryRes.json();

      setCities(citiesData);
      setSummary(summaryData);

      if (citiesData.length > 0) {
        setSelectedCity((current) => current || citiesData[0].city_name);
      }
    } catch (err) {
      console.error("Initial fetch failed:", err);
      setMessage("Failed to load dashboard data.");
    }
  }

  async function fetchTrendData(city) {
    if (!city) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/rent-trends?city=${encodeURIComponent(city)}`
      );
      const data = await res.json();
      setTrendData(data);
    } catch (err) {
      console.error("Trend fetch failed:", err);
      setMessage("Failed to load trend data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshData() {
    setEtlLoading(true);
    setMessage("Running ETL...");

    try {
      const res = await fetch(`${API_BASE}/run-etl`, {
        method: "POST"
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.error || result.message || "ETL failed");
      }

      setMessage("ETL complete. Reloading dashboard...");
      await fetchInitialData();

      const cityToLoad = selectedCity || (cities[0] && cities[0].city_name);
      if (cityToLoad) {
        await fetchTrendData(cityToLoad);
      }

      setMessage("Dashboard refreshed.");
    } catch (err) {
      console.error("Refresh ETL failed:", err);
      setMessage(`Refresh failed: ${err.message}`);
    } finally {
      setEtlLoading(false);
    }
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      fetchTrendData(selectedCity);
    }
  }, [selectedCity]);

  const chartData = useMemo(() => {
    return trendData.map((row) => ({
      ...row,
      label: `${row.year}-${String(row.month).padStart(2, "0")}`,
      avg_rent: Number(row.avg_rent)
    }));
  }, [trendData]);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: 24,
        background: "#f3f4f6",
        minHeight: "100vh"
      }}
    >
      <h1>Housing Analytics Dashboard</h1>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap"
        }}
      >
        <div>
          <label htmlFor="city-select">Select City: </label>
          <select
            id="city-select"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            {cities.map((c, i) => (
              <option key={`${c.city_name}-${i}`} value={c.city_name}>
                {c.city_name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRefreshData}
          disabled={etlLoading}
          style={{
            padding: "8px 14px",
            border: "none",
            borderRadius: 8,
            cursor: etlLoading ? "not-allowed" : "pointer"
          }}
        >
          {etlLoading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {message && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "#ffffff",
            borderRadius: 8
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading chart...</p>
      ) : (
        <RentTrendChart data={chartData} city={selectedCity} />
      )}

      <div
        style={{
          marginTop: 24,
          background: "#fff",
          padding: 16,
          borderRadius: 12,
          overflowX: "auto"
        }}
      >
        <h2>Summary</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">City</th>
              <th align="left">Province</th>
              <th align="left">Average Rent</th>
              <th align="left">Min Rent</th>
              <th align="left">Max Rent</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row, idx) => (
              <tr key={idx}>
                <td>{row.city_name}</td>
                <td>{row.province}</td>
                <td>{row.average_rent}</td>
                <td>{row.min_rent}</td>
                <td>{row.max_rent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
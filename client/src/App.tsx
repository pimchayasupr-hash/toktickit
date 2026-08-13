import { useState } from 'react';

interface Category {
  id: number;
  name: string;
}

interface HealthResponse {
  status: string;
  service: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function App() {
  const [systemStatus, setSystemStatus] = useState<'Online' | 'Offline' | null>(null);
  const [serviceName, setServiceName] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckSystem = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [healthResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/health`),
        fetch(`${API_BASE_URL}/api/categories`),
      ]);

      if (!healthResponse.ok) {
        throw new Error(`Health check failed with status ${healthResponse.status}`);
      }

      if (!categoriesResponse.ok) {
        throw new Error(`Categories request failed with status ${categoriesResponse.status}`);
      }

      const healthData: HealthResponse = await healthResponse.json();
      const categoriesData: Category[] = await categoriesResponse.json();

      setSystemStatus('Online');
      setServiceName(healthData.service || 'TokTickIT API');
      setCategories(categoriesData);
    } catch (error) {
      setSystemStatus('Offline');
      setCategories([]);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to connect to the backend service. Please ensure the server is running.';
      setErrorMessage(`System Status: Offline (${message})`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h1 className="h3 mb-3 text-center fw-bold">TokTickIT IT Service Desk</h1>
              <p className="text-muted text-center mb-4">
                Internal Service Desk Portal for IT Support Requests
              </p>

              <div className="d-grid mb-4">
                <button
                  type="button"
                  id="check-system-btn"
                  className="btn btn-primary btn-lg"
                  onClick={handleCheckSystem}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Loading...
                    </>
                  ) : (
                    'Check System'
                  )}
                </button>
              </div>

              {isLoading && (
                <div className="text-center my-3 text-secondary" data-testid="loading-indicator">
                  <p className="mb-0">Loading system status and categories...</p>
                </div>
              )}

              {errorMessage && (
                <div className="alert alert-danger mt-3" role="alert" data-testid="error-alert">
                  <h6 className="alert-heading fw-bold mb-1">System Error</h6>
                  <p className="mb-0">{errorMessage}</p>
                </div>
              )}

              {systemStatus && (
                <div className="card bg-light border-0 p-3 mb-4" data-testid="status-card">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">System Status:</span>
                    <span
                      className={`badge ${
                        systemStatus === 'Online' ? 'bg-success' : 'bg-danger'
                      } fs-6 px-3 py-2`}
                      data-testid="system-status-badge"
                    >
                      {systemStatus}
                    </span>
                  </div>
                  {serviceName && systemStatus === 'Online' && (
                    <div className="mt-2 text-muted small">
                      Service: <span className="fw-medium text-dark">{serviceName}</span>
                    </div>
                  )}
                </div>
              )}

              {categories.length > 0 && (
                <div className="mt-4" data-testid="categories-section">
                  <h2 className="h5 fw-bold mb-3">Supported Request Categories</h2>
                  <ul className="list-group" id="categories-list">
                    {categories.map((category) => (
                      <li
                        key={category.id}
                        className="list-group-item d-flex justify-content-between align-items-center py-2 px-3"
                      >
                        <span>{category.name}</span>
                        <span className="badge bg-secondary rounded-pill">#{category.id}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

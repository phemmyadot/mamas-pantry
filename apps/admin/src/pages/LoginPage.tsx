import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-forest-deep flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-3xl font-bold text-cream">
            Mama<em className="italic text-gold-light">&apos;s</em> Pantry
          </p>
          <p className="text-forest-pale text-sm mt-1 opacity-70">Admin Portal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-6 space-y-4"
        >
          <h1 className="text-lg font-semibold text-forest-deep mb-2">Sign in</h1>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              placeholder="admin@mamaspantry.ng"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-spice">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest-deep text-cream font-medium text-sm py-2.5 rounded-lg hover:bg-forest-mid disabled:opacity-60 transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

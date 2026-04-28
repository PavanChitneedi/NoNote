import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Alert, Button, Card, Input } from "./ui/primitives.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await login(email, password); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div data-ui="login-page" data-component="LoginPage" data-page="login" data-role="page" style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center",
      backgroundImage:"radial-gradient(circle at 30% 40%, var(--accent2)10 0%, transparent 60%), radial-gradient(circle at 80% 70%, #2196F310 0%, transparent 50%)",
      padding:20 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <Card style={{ padding:"36px 30px", boxShadow:"0 8px 40px var(--shadow)" }}>
          <div style={{ textAlign:"center", marginBottom:30 }}>
            <div style={{ fontSize:38 }}>⬡</div>
            <div style={{ fontSize:24, fontWeight:700, color:"var(--accent)", letterSpacing:2, marginTop:8 }}>NoNote</div>
            <div style={{ fontSize:11, color:"var(--text4)", marginTop:5, letterSpacing:1 }}>ARCHITECTURE · MIND MAPPING · DIAGRAMS</div>
          </div>

          <form onSubmit={handle} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:5 }}>EMAIL</label>
              <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"
                placeholder="you@example.com"
                style={{ background:"var(--bg)", padding:"11px 12px", fontSize:14 }}
              />
            </div>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:700, color:"var(--text4)", letterSpacing:2, marginBottom:5 }}>PASSWORD</label>
              <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"
                placeholder="••••••••"
                style={{ background:"var(--bg)", padding:"11px 12px", fontSize:14 }}
              />
            </div>
            {error && (
              <Alert tone="danger" style={{ fontSize:12 }}>
                {error}
              </Alert>
            )}
            <Button type="submit" variant="primary" loading={loading} style={{ marginTop:6, padding:"12px", fontSize:13, letterSpacing:1 }}>
              SIGN IN →
            </Button>
          </form>

          <div style={{ marginTop:20, textAlign:"center", fontSize:11, color:"var(--text4)" }}>
            Contact your administrator to get access.
          </div>
        </Card>
      </div>
    </div>
  );
}

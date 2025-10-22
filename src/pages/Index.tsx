import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar baseado no status de autenticação
    const userType = localStorage.getItem("userType");
    if (userType === "client") {
      navigate("/dashboard");
    } else if (userType === "admin") {
      navigate("/admin/dashboard");
    } else {
      // Se não estiver autenticado, mostrar landing page
      navigate("/home");
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-xl text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
};

export default Index;

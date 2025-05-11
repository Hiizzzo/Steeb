
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import SteveAvatar from "@/components/SteveAvatar";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-steve-gray-light p-4">
      <div className="text-center">
        <SteveAvatar size="lg" mood="angry" />
        
        <h1 className="text-4xl font-bold mb-4 mt-4">404</h1>
        <p className="text-xl mb-6">¡Oops! Steve no puede encontrar esta página</p>
        
        <div className="steve-border bg-steve-white p-4 rounded-xl mb-6">
          <p>Steve dice: "No deberías estar aquí, ¡estás procrastinando! Vuelve a tus tareas."</p>
        </div>
        
        <Button 
          asChild 
          className="bg-steve-black text-steve-white hover:bg-steve-gray-dark steve-shadow"
        >
          <a href="/">Volver a las tareas</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

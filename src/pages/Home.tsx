import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  
  // Redirect to info collection page
  useEffect(() => {
    navigate('/');
  }, [navigate]);
  
  return null;
}
import React from 'react';
import { Link } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';
export function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '6rem',
        fontWeight: '700',
        color: '#e5e7eb',
        lineHeight: 1,
      }}>
        404
      </div>
      <h1 style={{
        fontSize: '1.875rem',
        fontWeight: '700',
        color: '#111827',
        marginTop: '1rem',
      }}>
        Page non trouvée
      </h1>
      <p style={{
        fontSize: '1rem',
        color: '#6b7280',
        marginTop: '0.5rem',
        maxWidth: '28rem',
      }}>
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginTop: '2rem',
      }}>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft size={20} />
          Retour
        </Button>
        <Link to="/">
          <Button>
            <Home size={20} />
            Accueil
          </Button>
        </Link>
      </div>
    </div>
  );
}

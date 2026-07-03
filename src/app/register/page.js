"use client";

import { useState } from 'react';
import { signIn } from "next-auth/react";
import { ArrowRight, Mail, Lock, User, Sparkles } from "lucide-react";
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      alert('Veuillez remplir tous les champs (Prénom, Email, Mot de passe).');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      if (res.ok) {
        setShowCodeInput(true);
      } else {
        alert('Erreur lors de l\'envoi du code.');
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
    setIsLoading(false);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await signIn('credentials', {
      name,
      email,
      password,
      code: verificationCode,
      redirect: false,
    });
    
    if (res?.error) {
      alert(res.error);
      setIsLoading(false);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px', textAlign: 'center' }}>
        <Sparkles size={32} color="#fff" style={{ marginBottom: '24px' }} />
        <h1 style={{ fontSize: '28px', color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}>Rejoignez DropX AI</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>Créez votre compte pour commencer.</p>

        {!showCodeInput ? (
          <form onSubmit={handleInitialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <User size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Votre prénom" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none' }}
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                placeholder="Adresse email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none' }}
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                placeholder="Créer un mot de passe" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none' }}
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              style={{ background: '#fff', color: '#000', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '8px', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Envoi du code...' : 'Créer mon compte'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <p style={{ color: '#10b981', fontSize: '14px', marginBottom: '8px' }}>Un code à 6 chiffres a été envoyé à <b>{email}</b></p>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Code de vérification (ex: 123456)" 
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid #10b981', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none', textAlign: 'center', letterSpacing: '2px' }}
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              style={{ background: '#10b981', color: '#fff', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '8px', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Vérification...' : 'Valider et commencer'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>OU</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        <button 
          onClick={() => signIn('google', { callbackUrl: '/' })}
          style={{ width: '100%', background: 'transparent', color: '#fff', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          Déjà un compte ? <Link href="/login" style={{ color: '#fff', fontWeight: 'bold' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

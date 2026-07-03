import React, { useState, useEffect } from 'react';
import { FullFormData } from '../types';
import Logo from './Logo';

interface AdminPanelProps {
  onClose: () => void;
  onResend: (data: FullFormData) => Promise<boolean>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onResend }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [email, setEmail] = useState('wellington.rodovalho@gmail.com');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [lastSubmission, setLastSubmission] = useState<FullFormData | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  // Carregar última submissão do localStorage
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const stored = localStorage.getItem('last_successful_submission');
        if (stored) {
          setLastSubmission(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Erro ao ler do localStorage:', err);
      }
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Wellington ou administrador podem acessar
    if (
      (cleanEmail === 'wellington.rodovalho@gmail.com' || cleanEmail === 'admin@alugagoias.com.br' || cleanEmail === 'admin') &&
      (cleanPassword === 'alugagoias' || cleanPassword === 'admin' || cleanPassword === 'wellington2026')
    ) {
      sessionStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
    } else {
      setLoginError('E-mail ou senha de acesso inválidos.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setPassword('');
    setResendStatus('idle');
  };

  const handleResendClick = async () => {
    if (!lastSubmission) return;
    setIsResending(true);
    setResendStatus('idle');
    setResendMessage('');

    try {
      const success = await onResend(lastSubmission);
      if (success) {
        setResendStatus('success');
        setResendMessage(`Enviado com sucesso em ${new Date().toLocaleTimeString('pt-BR')}!`);
      } else {
        setResendStatus('error');
        setResendMessage('Falha ao enviar. Verifique a conexão com o Google Sheets.');
      }
    } catch (err) {
      setResendStatus('error');
      setResendMessage('Erro de conexão durante o reenvio.');
    } finally {
      setIsResending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-4 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 bg-slate-900 text-white flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shadow-inner">
            <Logo className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Área do Administrador</h2>
            <p className="text-xs text-slate-300 mt-1">Acesso exclusivo para Wellington Rodovalho</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
          {loginError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold uppercase text-center flex items-center justify-center gap-2">
              <i className="fas fa-exclamation-triangle"></i>
              {loginError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">E-mail de Acesso</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i className="fas fa-envelope"></i>
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@gmail.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-300"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i className="fas fa-lock"></i>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-300"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <i className="fas fa-sign-in-alt"></i>
              Entrar no Painel
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Voltar ao Check-in
            </button>
          </div>

          <div className="pt-2 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Dica: use a senha <span className="text-slate-500 underline font-black">alugagoias</span>
            </p>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Admin Header Info */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/15">
            <i className="fas fa-user-shield text-xl text-amber-400"></i>
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-300">Painel do Administrador</h2>
            <p className="text-xs text-slate-400 mt-0.5">Conectado como <strong className="text-amber-400">{email}</strong></p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleLogout} 
            className="flex-1 md:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase tracking-wider rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <i className="fas fa-sign-out-alt"></i>
            Sair
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 md:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Voltar
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {lastSubmission ? (
        <div className="space-y-6">
          <div className="p-6 bg-amber-50/40 border border-amber-100 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-amber-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <i className="fas fa-history text-amber-600"></i>
                  Último Check-in Enviado
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                  Dados guardados localmente para retransmissão rápida
                </p>
              </div>
              <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-2.5 py-1 rounded-full uppercase">
                Pronto para reenvio
              </span>
            </div>

            {/* Compact summary grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
              {/* Titular */}
              <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Titular da Reserva</span>
                <p className="text-slate-800 uppercase text-sm font-black">{lastSubmission.mainGuest.fullName}</p>
                <div className="text-[10px] text-slate-600 space-y-0.5">
                  <p>CPF: {lastSubmission.mainGuest.cpf}</p>
                  <p>Telefone: {lastSubmission.mainGuest.phone}</p>
                  <p className="lowercase">E-mail: {lastSubmission.mainGuest.email}</p>
                </div>
              </div>

              {/* Reserva */}
              <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Detalhes da Hospedagem</span>
                <p className="text-slate-800 uppercase text-xs font-black truncate">{lastSubmission.propertyDetails?.name || 'Imóvel sem nome'}</p>
                <div className="text-[10px] text-slate-600 space-y-0.5">
                  <p>Check-in: <span className="text-slate-800 font-black">{lastSubmission.reservation.startDate}</span></p>
                  <p>Check-out: <span className="text-slate-800 font-black">{lastSubmission.reservation.endDate}</span></p>
                  <p>Total de Hóspedes: {lastSubmission.reservation.guestCount}</p>
                </div>
              </div>

              {/* Extras */}
              <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2 col-span-1 md:col-span-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Veículo, Pets e Acompanhantes</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] text-slate-600">
                  <div>
                    <p className="text-slate-400 font-black uppercase text-[8px] mb-0.5">Veículo</p>
                    <p>{lastSubmission.reservation.hasVehicle 
                      ? `${lastSubmission.reservation.vehicleBrand} ${lastSubmission.reservation.vehicleModel} (${lastSubmission.reservation.vehiclePlate?.toUpperCase()})` 
                      : 'Nenhum veículo registrado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-black uppercase text-[8px] mb-0.5">Pet</p>
                    <p>{lastSubmission.pet.hasPet 
                      ? `${lastSubmission.pet.name} - ${lastSubmission.pet.breed} (${lastSubmission.pet.species})` 
                      : 'Nenhum pet registrado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-black uppercase text-[8px] mb-0.5">Acompanhantes</p>
                    <p>{lastSubmission.companions.length > 0 
                      ? `${lastSubmission.companions.length} pessoa(s): ` + lastSubmission.companions.map(c => c.name.split(' ')[0]).join(', ')
                      : 'Nenhum acompanhante'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Box */}
            <div className="pt-4 flex flex-col items-center gap-4">
              <button
                onClick={handleResendClick}
                disabled={isResending}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  isResending 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                }`}
              >
                {isResending ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-lg"></i>
                    Processando Reenvio...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane text-lg"></i>
                    Reenviar Formulário para a Planilha & E-mail
                  </>
                )}
              </button>

              {resendStatus === 'success' && (
                <div className="w-full p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check"></i>
                  </div>
                  <div>
                    <p className="font-black text-xs uppercase">Check-in Reenviado com Sucesso!</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">{resendMessage}</p>
                  </div>
                </div>
              )}

              {resendStatus === 'error' && (
                <div className="w-full p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
                  <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div>
                    <p className="font-black text-xs uppercase">Falha ao Reenviar</p>
                    <p className="text-[10px] text-red-600 mt-0.5">{resendMessage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Apenas um envio é salvo localmente por dispositivo por razões de privacidade.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
          <i className="fas fa-history text-3xl text-slate-300 block"></i>
          <p className="font-black text-xs uppercase text-slate-400">Nenhum envio recente registrado neste navegador</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase max-w-sm mx-auto leading-relaxed">
            Realize pelo menos um check-in completo neste dispositivo para salvar os dados no cache de retransmissão automática.
          </p>
        </div>
      )}
    </div>
  );
};

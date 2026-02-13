
import React, { useState, useEffect, useRef } from 'react';
import { FormStep, FullFormData, PROPERTIES } from './types';
import { saveToGoogleSheets } from './services/externalServices';
import StepIndicator from './components/StepIndicator';
import FileUpload from './components/FileUpload';
import SelfieCapture from './components/SelfieCapture';
import Logo from './components/Logo';

const App: React.FC = () => {
  const [step, setStep] = useState<FormStep>(FormStep.CONSENT);
  const [loading, setLoading] = useState(false);
  const formTopRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<FullFormData>({
    reservation: {
      startDate: '',
      endDate: '',
      guestCount: 1,
      reasonForVisit: 'Turismo',
      propertyId: '3',
      totalValue: 0,
      securityDepositValue: 0,
      hasSecurityDeposit: false
    },
    pet: {
      hasPet: false,
      name: '',
      breed: '',
      weight: '',
      age: '',
      species: 'Canino',
      size: 'Pequeno'
    },
    mainGuest: {
      fullName: '',
      cpf: '',
      rg: '',
      nationality: 'Brasileira',
      email: '',
      phone: '',
      address: '',
      maritalStatus: '',
      profession: ''
    },
    companions: [],
    lgpdConsent: false
  });

  const selectedProperty = PROPERTIES.find(p => p.id === formData.reservation.propertyId) || PROPERTIES[0];

  // Garante que o scroll vá para o topo do formulário a cada mudança de passo
  useEffect(() => {
    if (formTopRef.current) {
      setTimeout(() => {
        formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleReservationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      reservation: {
        ...prev.reservation,
        [name]: (name === 'guestCount' || name === 'totalValue' || name === 'securityDepositValue') 
          ? (value === '' ? 0 : parseFloat(value)) 
          : val
      }
    }));
  };

  const handlePetChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, pet: { ...prev.pet, [name]: val } }));
  };

  const handleMainGuestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      mainGuest: { ...prev.mainGuest, [name]: value } 
    }));
  };

  const handleCompanionChange = (index: number, name: string, value: string) => {
    const newCompanions = [...formData.companions];
    if (!newCompanions[index]) {
      newCompanions[index] = { id: Math.random().toString(), name: '', documentNumber: '' };
    }
    newCompanions[index] = { ...newCompanions[index], [name]: value };
    setFormData(prev => ({ ...prev, companions: newCompanions }));
  };

  const handleDocumentUpload = (role: 'main' | 'companion' | 'pet', index?: number) => (base64: string) => {
    if (role === 'main') {
      setFormData(prev => ({ ...prev, mainGuest: { ...prev.mainGuest, documentFile: base64 } }));
    } else if (role === 'pet') {
      setFormData(prev => ({ ...prev, pet: { ...prev.pet, vaccineFile: base64 } }));
    } else if (index !== undefined) {
      const newCompanions = [...formData.companions];
      newCompanions[index] = { ...newCompanions[index], documentFile: base64 };
      setFormData(prev => ({ ...prev, companions: newCompanions }));
    }
  };

  const handleSelfieCapture = (base64: string) => {
    setFormData(prev => ({ ...prev, mainGuest: { ...prev.mainGuest, selfieFile: base64 } }));
  };

  const finalizeProcess = async () => {
    if (formData.reservation.totalValue <= 0) {
      alert("Por favor, informe o valor total da reserva.");
      return;
    }
    setLoading(true);
    try {
      const propertyDetails = PROPERTIES.find(p => p.id === formData.reservation.propertyId) || PROPERTIES[0];
      await saveToGoogleSheets({ ...formData, propertyDetails });
      setStep(FormStep.SUCCESS);
    } catch (error) {
      alert("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50 flex flex-col font-['Nunito']">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Logo className="w-12 h-12" />
            <div>
              <h1 className="font-black text-slate-800 text-lg uppercase tracking-tight">WELLINGTON RODOVALHO FONSECA</h1>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Corretagem de Imóveis</p>
            </div>
          </div>
          <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase">
            <span>CRECI: GO 42695</span>
            <span>CPF: 269.462.701-34</span>
          </div>
        </div>
      </header>

      {/* Âncora oculta para garantir o scroll para o topo do form */}
      <div ref={formTopRef} className="h-0 w-0 pointer-events-none opacity-0" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 mt-6">
        {step > FormStep.CONSENT && step !== FormStep.SUCCESS && <StepIndicator currentStep={step} />}

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-10 transition-all duration-500">
          
          {step === FormStep.CONSENT && (
            <div className="space-y-8 text-center animate-in fade-in">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto"><Logo className="w-12 h-12" /></div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800">Termo de Consentimento</h2>
                <p className="text-slate-500 text-sm max-w-md mx-auto">Seus dados serão utilizados exclusivamente para reserva e contrato conforme a LGPD.</p>
              </div>
              <label className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 cursor-pointer text-left transition-all hover:bg-blue-50">
                <input type="checkbox" checked={formData.lgpdConsent} onChange={(e) => setFormData(prev => ({ ...prev, lgpdConsent: e.target.checked }))} className="w-6 h-6 rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-bold text-blue-900 leading-tight">Autorizo o processamento dos meus dados e documentos para fins contratuais.</span>
              </label>
              <button onClick={nextStep} disabled={!formData.lgpdConsent} className="w-full py-5 bg-blue-600 disabled:bg-slate-200 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95">CONTINUAR</button>
            </div>
          )}

          {step === FormStep.RESERVATION && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Informações da Reserva</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Imóvel</label>
                    <select name="propertyId" value={formData.reservation.propertyId} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none">
                      {PROPERTIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Quantidade de Hóspedes</label>
                    <select name="guestCount" value={formData.reservation.guestCount} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none">
                      {Array.from({ length: selectedProperty.capacity }).map((_, i) => <option key={i+1} value={i+1}>{i+1} Hóspede(s)</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data de Entrada (Check-in)</label>
                    <input type="date" name="startDate" value={formData.reservation.startDate} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data de Saída (Check-out)</label>
                    <input type="date" name="endDate" value={formData.reservation.endDate} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl shadow-sm">
                    <label className="text-[10px] font-black text-blue-600 uppercase mb-1 block tracking-wider">Valor Total da Reserva</label>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-400 text-lg">R$</span>
                      <input type="number" step="0.01" name="totalValue" value={formData.reservation.totalValue || ''} onChange={handleReservationChange} placeholder="0,00" className="bg-transparent border-none p-0 focus:ring-0 font-black text-blue-700 text-2xl w-full" />
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border transition-all duration-300 ${formData.reservation.hasSecurityDeposit ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Garantia de Caução</label>
                      <input type="checkbox" name="hasSecurityDeposit" checked={formData.reservation.hasSecurityDeposit} onChange={handleReservationChange} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                    </div>
                    {formData.reservation.hasSecurityDeposit && (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                        <span className="font-bold text-emerald-400 text-lg">R$</span>
                        <input type="number" step="0.01" name="securityDepositValue" value={formData.reservation.securityDepositValue || ''} onChange={handleReservationChange} placeholder="0,00" className="bg-transparent border-none p-0 focus:ring-0 font-black text-emerald-700 text-2xl w-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={nextStep} disabled={!formData.reservation.startDate || !formData.reservation.endDate || formData.reservation.totalValue <= 0} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98]">Próximo: Dados do Titular</button>
            </div>
          )}

          {step === FormStep.MAIN_GUEST && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Identificação do Titular</h2>
              <div className="grid gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome Completo</label>
                  <input name="fullName" value={formData.mainGuest.fullName} onChange={handleMainGuestChange} placeholder="Digite seu nome completo" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Estado Civil</label>
                    <select name="maritalStatus" value={formData.mainGuest.maritalStatus} onChange={handleMainGuestChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecione...</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                      <option value="União Estável">União Estável</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Profissão</label>
                    <input name="profession" value={formData.mainGuest.profession} onChange={handleMainGuestChange} placeholder="Ex: Engenheiro, Professor..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">CPF</label>
                    <input name="cpf" value={formData.mainGuest.cpf} onChange={handleMainGuestChange} placeholder="000.000.000-00" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">RG</label>
                    <input name="rg" value={formData.mainGuest.rg} onChange={handleMainGuestChange} placeholder="Número do RG" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nacionalidade</label>
                    <input name="nationality" value={formData.mainGuest.nationality} onChange={handleMainGuestChange} placeholder="Ex: Brasileira" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">E-mail para Receber o Contrato</label>
                    <input name="email" value={formData.mainGuest.email} onChange={handleMainGuestChange} placeholder="exemplo@email.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">WhatsApp de Contato</label>
                    <input name="phone" value={formData.mainGuest.phone} onChange={handleMainGuestChange} placeholder="(00) 00000-0000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Endereço Residencial Completo</label>
                  <textarea name="address" rows={2} value={formData.mainGuest.address} onChange={handleMainGuestChange} placeholder="Rua, Número, Bairro, Cidade-UF, CEP" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <FileUpload id="main_doc" label="Foto do Documento (Frente)" onFileSelect={handleDocumentUpload('main')} />
                  <SelfieCapture label="Selfie para Garantia Contratual" onCapture={handleSelfieCapture} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl text-slate-600 hover:bg-slate-200 transition-all">Voltar</button>
                <button onClick={nextStep} disabled={!formData.mainGuest.fullName || !formData.mainGuest.documentFile || !formData.mainGuest.selfieFile || !formData.mainGuest.maritalStatus || !formData.mainGuest.profession} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg transition-all hover:bg-blue-700 active:scale-[0.98]">Próximo: Acompanhantes</button>
              </div>
            </div>
          )}

          {step === FormStep.COMPANIONS && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Hóspedes Acompanhantes</h2>
              {formData.reservation.guestCount > 1 ? (
                <div className="space-y-4">
                  {Array.from({ length: formData.reservation.guestCount - 1 }).map((_, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-inner">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Acompanhante {idx + 1}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome Completo</label>
                          <input placeholder="Nome" value={formData.companions[idx]?.name || ''} onChange={(e) => handleCompanionChange(idx, 'name', e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Documento (CPF ou RG)</label>
                          <input placeholder="Documento" value={formData.companions[idx]?.documentNumber || ''} onChange={(e) => handleCompanionChange(idx, 'documentNumber', e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                  <i className="fas fa-user-friends text-slate-300 text-4xl mb-3"></i>
                  <p className="text-slate-400 font-medium italic">Reserva individual. Nenhum acompanhante necessário.</p>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl text-slate-600 hover:bg-slate-200 transition-all">Voltar</button>
                <button onClick={finalizeProcess} disabled={loading} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 transition-all hover:bg-emerald-700 active:scale-[0.98]">
                  {loading ? <i className="fas fa-circle-notch fa-spin text-xl"></i> : <i className="fas fa-paper-plane"></i>}
                  {loading ? 'ENVIANDO CADASTRO...' : 'FINALIZAR E ENVIAR'}
                </button>
              </div>
            </div>
          )}

          {step === FormStep.SUCCESS && (
            <div className="text-center py-16 space-y-8 animate-in zoom-in">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner border-2 border-emerald-50"><i className="fas fa-check"></i></div>
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">Sucesso!</h2>
                <div className="text-slate-500 text-lg">
                  <p>Seus dados e fotos foram salvos com total segurança.</p>
                  <p className="font-bold text-slate-800 mt-2">Nossa equipe irá gerar o contrato e enviar ao seu e-mail em breve.</p>
                </div>
              </div>
              <button onClick={() => window.location.reload()} className="px-12 py-5 bg-slate-800 text-white font-black rounded-2xl transition-all hover:bg-slate-900 shadow-xl active:scale-95">NOVO CADASTRO</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

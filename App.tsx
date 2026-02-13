
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
      species: 'Cão/Gato',
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleMainGuestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, mainGuest: { ...prev.mainGuest, [name]: value } }));
  };

  const handlePetToggle = (hasPet: boolean) => {
    setFormData(prev => ({ ...prev, pet: { ...prev.pet, hasPet } }));
  };

  const handlePetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, pet: { ...prev.pet, [name]: value } }));
  };

  const handleCompanionChange = (index: number, name: string, value: string) => {
    const newCompanions = [...formData.companions];
    if (!newCompanions[index]) newCompanions[index] = { id: Math.random().toString(), name: '', documentNumber: '' };
    newCompanions[index] = { ...newCompanions[index], [name]: value };
    setFormData(prev => ({ ...prev, companions: newCompanions }));
  };

  const handleUpload = (role: 'main' | 'companion' | 'pet', index?: number) => (base64: string) => {
    if (role === 'main') setFormData(prev => ({ ...prev, mainGuest: { ...prev.mainGuest, documentFile: base64 } }));
    else if (role === 'pet') setFormData(prev => ({ ...prev, pet: { ...prev.pet, vaccineFile: base64 } }));
    else if (index !== undefined) {
      const newCompanions = [...formData.companions];
      newCompanions[index] = { ...newCompanions[index], documentFile: base64 };
      setFormData(prev => ({ ...prev, companions: newCompanions }));
    }
  };

  const finalizeProcess = async () => {
    setLoading(true);
    try {
      const success = await saveToGoogleSheets({ ...formData, propertyDetails: selectedProperty });
      if (success) setStep(FormStep.SUCCESS);
      else alert("Erro ao salvar. Tente novamente.");
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50 flex flex-col font-['Nunito']">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <h1 className="font-black text-slate-800 text-sm uppercase leading-tight">WELLINGTON RODOVALHO<br/><span className="text-blue-600 text-[10px]">CORRETOR DE IMÓVEIS</span></h1>
        </div>
        <div className="text-[10px] font-bold text-slate-400 text-right uppercase">CRECI: GO 42695</div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 mt-6">
        {step > FormStep.CONSENT && step !== FormStep.SUCCESS && <StepIndicator currentStep={step} />}

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10">
          
          {step === FormStep.CONSENT && (
            <div className="space-y-6 text-center py-4">
              <h2 className="text-2xl font-black text-slate-800">Bem-vindo ao Check-in</h2>
              <p className="text-slate-500 text-sm">Precisamos de algumas informações para gerar o seu contrato de locação temporária.</p>
              <label className="flex items-center gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer text-left">
                <input type="checkbox" checked={formData.lgpdConsent} onChange={(e) => setFormData(prev => ({ ...prev, lgpdConsent: e.target.checked }))} className="w-6 h-6 rounded text-blue-600" />
                <span className="text-xs font-bold text-blue-900 uppercase">Autorizo o uso dos meus dados para fins contratuais (LGPD).</span>
              </label>
              <button onClick={nextStep} disabled={!formData.lgpdConsent} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-lg disabled:opacity-30">INICIAR CADASTRO</button>
            </div>
          )}

          {step === FormStep.RESERVATION && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b pb-2">1. Dados da Hospedagem</h2>
              <div className="grid gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Imóvel da Reserva</label>
                  <select name="propertyId" value={formData.reservation.propertyId} onChange={handleReservationChange} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
                    {PROPERTIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Entrada (Check-in)</label>
                    <input type="date" name="startDate" value={formData.reservation.startDate} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Saída (Check-out)</label>
                    <input type="date" name="endDate" value={formData.reservation.endDate} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <label className="text-[10px] font-black text-blue-600 uppercase mb-1 block">Número de Hóspedes</label>
                    <select name="guestCount" value={formData.reservation.guestCount} onChange={handleReservationChange} className="bg-transparent border-none p-0 focus:ring-0 font-black text-blue-800 text-xl w-full">
                      {Array.from({ length: selectedProperty.capacity }).map((_, i) => <option key={i+1} value={i+1}>{i+1} Pessoa(s)</option>)}
                    </select>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <label className="text-[10px] font-black text-emerald-600 uppercase mb-1 block">Valor Total da Reserva (R$)</label>
                    <input type="number" name="totalValue" value={formData.reservation.totalValue || ''} onChange={handleReservationChange} placeholder="0,00" className="bg-transparent border-none p-0 focus:ring-0 font-black text-emerald-800 text-xl w-full" />
                  </div>
                </div>
              </div>
              <button onClick={nextStep} disabled={!formData.reservation.startDate || formData.reservation.totalValue <= 0} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 active:scale-[0.98] transition-all">CONTINUAR</button>
            </div>
          )}

          {step === FormStep.MAIN_GUEST && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-lg font-black text-slate-800 uppercase border-b pb-2">2. Identificação do Titular</h2>
              <div className="grid gap-4">
                <input name="fullName" value={formData.mainGuest.fullName} onChange={handleMainGuestChange} placeholder="NOME COMPLETO" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase placeholder:text-slate-300" />
                <div className="grid grid-cols-2 gap-4">
                  <input name="cpf" value={formData.mainGuest.cpf} onChange={handleMainGuestChange} placeholder="CPF" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  <input name="rg" value={formData.mainGuest.rg} onChange={handleMainGuestChange} placeholder="RG" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select name="maritalStatus" value={formData.mainGuest.maritalStatus} onChange={handleMainGuestChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="">ESTADO CIVIL</option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="União Estável">União Estável</option>
                  </select>
                  <input name="profession" value={formData.mainGuest.profession} onChange={handleMainGuestChange} placeholder="PROFISSÃO" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <input name="email" value={formData.mainGuest.email} onChange={handleMainGuestChange} placeholder="E-MAIL" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUpload id="doc_main" label="Doc. Identidade (Frente)" onFileSelect={handleUpload('main')} />
                  <SelfieCapture label="Selfie do Titular" onCapture={(base64) => setFormData(prev => ({ ...prev, mainGuest: { ...prev.mainGuest, selfieFile: base64 } }))} />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl">VOLTAR</button>
                <button onClick={nextStep} disabled={!formData.mainGuest.documentFile || !formData.mainGuest.selfieFile} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-xl">PRÓXIMO: PET</button>
              </div>
            </div>
          )}

          {step === FormStep.PET_INFO && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-800">VOCÊ LEVARÁ PET?</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Informação obrigatória para o contrato</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => handlePetToggle(false)}
                  className={`py-10 rounded-3xl border-4 transition-all flex flex-col items-center gap-3 ${!formData.pet.hasPet ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${!formData.pet.hasPet ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                    <i className="fas fa-times text-2xl"></i>
                  </div>
                  <span className="font-black text-sm uppercase">NÃO LEVAREI</span>
                </button>

                <button 
                  onClick={() => handlePetToggle(true)}
                  className={`py-10 rounded-3xl border-4 transition-all flex flex-col items-center gap-3 ${formData.pet.hasPet ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-slate-50'}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${formData.pet.hasPet ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                    <i className="fas fa-dog text-2xl"></i>
                  </div>
                  <span className="font-black text-sm uppercase">SIM, LEVAREI</span>
                </button>
              </div>

              {formData.pet.hasPet && (
                <div className="space-y-4 p-6 bg-orange-50/50 border border-orange-100 rounded-3xl animate-in zoom-in-95">
                  <div className="grid grid-cols-2 gap-4">
                    <input name="name" value={formData.pet.name} onChange={handlePetChange} placeholder="NOME DO PET" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold uppercase" />
                    <input name="breed" value={formData.pet.breed} onChange={handlePetChange} placeholder="RAÇA / ESPÉCIE" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold uppercase" />
                  </div>
                  <FileUpload id="pet_vac" label="Carteira de Vacinação do Pet" onFileSelect={handleUpload('pet')} />
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl">VOLTAR</button>
                <button onClick={nextStep} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-xl">PRÓXIMO: HÓSPEDES</button>
              </div>
            </div>
          )}

          {step === FormStep.COMPANIONS && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-lg font-black text-slate-800 uppercase border-b pb-2">3. Acompanhantes ({formData.reservation.guestCount - 1})</h2>
              {formData.reservation.guestCount > 1 ? (
                <div className="space-y-4">
                  {Array.from({ length: formData.reservation.guestCount - 1 }).map((_, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <input placeholder="NOME DO ACOMPANHANTE" value={formData.companions[idx]?.name || ''} onChange={(e) => handleCompanionChange(idx, 'name', e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase" />
                      <input placeholder="DOCUMENTO" value={formData.companions[idx]?.documentNumber || ''} onChange={(e) => handleCompanionChange(idx, 'documentNumber', e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed">Reserva Individual</div>
              )}
              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl">VOLTAR</button>
                <button onClick={finalizeProcess} disabled={loading} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2">
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                  {loading ? 'ENVIANDO...' : 'FINALIZAR'}
                </button>
              </div>
            </div>
          )}

          {step === FormStep.SUCCESS && (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner"><i className="fas fa-check"></i></div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">CADASTRO REALIZADO!</h2>
                <p className="text-slate-500 text-sm">Os dados foram enviados e as imagens estão sendo processadas no Google Drive.</p>
              </div>
              <button onClick={() => window.location.reload()} className="px-12 py-5 bg-slate-800 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">NOVO CADASTRO</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

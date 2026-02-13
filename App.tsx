
import React, { useState, useEffect } from 'react';
import { FormStep, FullFormData, PROPERTIES } from './types';
import { saveToGoogleSheets } from './services/externalServices';
import StepIndicator from './components/StepIndicator';
import FileUpload from './components/FileUpload';
import SelfieCapture from './components/SelfieCapture';
import Logo from './components/Logo';

const App: React.FC = () => {
  const [step, setStep] = useState<FormStep>(FormStep.CONSENT);
  const [loading, setLoading] = useState(false);
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

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

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
    setFormData(prev => ({ ...prev, mainGuest: { ...prev.mainGuest, [name]: value } }));
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

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 mt-6">
        {step > FormStep.CONSENT && step !== FormStep.SUCCESS && <StepIndicator currentStep={step} />}

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-10 transition-all duration-500">
          
          {step === FormStep.CONSENT && (
            <div className="space-y-8 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto"><Logo className="w-12 h-12" /></div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800">Termo de Consentimento</h2>
                <p className="text-slate-500 text-sm max-w-md mx-auto">Seus dados serão utilizados exclusivamente para reserva e contrato conforme a LGPD.</p>
              </div>
              <label className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 cursor-pointer text-left">
                <input type="checkbox" checked={formData.lgpdConsent} onChange={(e) => setFormData(prev => ({ ...prev, lgpdConsent: e.target.checked }))} className="w-6 h-6 rounded text-blue-600" />
                <span className="text-sm font-bold text-blue-900 leading-tight">Autorizo o processamento dos meus dados e documentos para fins contratuais.</span>
              </label>
              <button onClick={nextStep} disabled={!formData.lgpdConsent} className="w-full py-5 bg-blue-600 disabled:bg-slate-200 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95">CONTINUAR</button>
            </div>
          )}

          {step === FormStep.RESERVATION && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Informações da Reserva</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Imóvel</label>
                    <select name="propertyId" value={formData.reservation.propertyId} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                      {PROPERTIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Hóspedes</label>
                    <select name="guestCount" value={formData.reservation.guestCount} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                      {Array.from({ length: selectedProperty.capacity }).map((_, i) => <option key={i+1} value={i+1}>{i+1} Hóspede(s)</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Data Entrada</label>
                    <input type="date" name="startDate" value={formData.reservation.startDate} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Data Saída</label>
                    <input type="date" name="endDate" value={formData.reservation.endDate} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <label className="text-[10px] font-black text-blue-600 uppercase mb-1 block">Valor Total da Reserva</label>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-400">R$</span>
                      <input type="number" step="0.01" name="totalValue" value={formData.reservation.totalValue || ''} onChange={handleReservationChange} placeholder="0,00" className="bg-transparent border-none p-0 focus:ring-0 font-black text-blue-700 text-xl w-full" />
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${formData.reservation.hasSecurityDeposit ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Garantia de Caução</label>
                      <input type="checkbox" name="hasSecurityDeposit" checked={formData.reservation.hasSecurityDeposit} onChange={handleReservationChange} className="w-4 h-4 rounded text-emerald-600" />
                    </div>
                    {formData.reservation.hasSecurityDeposit ? (
                      <div className="flex items-center gap-2 animate-in fade-in">
                        <span className="font-bold text-emerald-400">R$</span>
                        <input type="number" step="0.01" name="securityDepositValue" value={formData.reservation.securityDepositValue || ''} onChange={handleReservationChange} placeholder="0,00" className="bg-transparent border-none p-0 focus:ring-0 font-black text-emerald-700 text-xl w-full" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 italic">Opcional / Não exigido</span>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={nextStep} disabled={!formData.reservation.startDate || !formData.reservation.endDate || formData.reservation.totalValue <= 0} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg">Próximo: Dados do Titular</button>
            </div>
          )}

          {step === FormStep.MAIN_GUEST && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Identificação do Titular</h2>
              <div className="grid gap-4">
                <input name="fullName" value={formData.mainGuest.fullName} onChange={handleMainGuestChange} placeholder="Nome Completo" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="cpf" value={formData.mainGuest.cpf} onChange={handleMainGuestChange} placeholder="CPF" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  <input name="rg" value={formData.mainGuest.rg} onChange={handleMainGuestChange} placeholder="RG" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="email" value={formData.mainGuest.email} onChange={handleMainGuestChange} placeholder="E-mail para contrato" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  <input name="phone" value={formData.mainGuest.phone} onChange={handleMainGuestChange} placeholder="WhatsApp" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <FileUpload id="main_doc" label="Foto do Documento (Frente)" onFileSelect={handleDocumentUpload('main')} />
                  <SelfieCapture label="Selfie para Garantia Contratual" onCapture={handleSelfieCapture} />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl text-slate-600">Voltar</button>
                <button onClick={nextStep} disabled={!formData.mainGuest.fullName || !formData.mainGuest.documentFile || !formData.mainGuest.selfieFile} className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg">Próximo: Acompanhantes</button>
              </div>
            </div>
          )}

          {step === FormStep.COMPANIONS && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Hóspedes Acompanhantes</h2>
              {formData.reservation.guestCount > 1 ? (
                <div className="space-y-4">
                  {Array.from({ length: formData.reservation.guestCount - 1 }).map((_, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <p className="text-[10px] font-black text-blue-600 uppercase">Acompanhante {idx + 1}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input placeholder="Nome" value={formData.companions[idx]?.name || ''} onChange={(e) => handleCompanionChange(idx, 'name', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                        <input placeholder="Documento" value={formData.companions[idx]?.documentNumber || ''} onChange={(e) => handleCompanionChange(idx, 'documentNumber', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 font-medium italic">Nenhum acompanhante para esta reserva.</div>
              )}
              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl text-slate-600">Voltar</button>
                <button onClick={finalizeProcess} disabled={loading} className="flex-[2] py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : 'FINALIZAR E ENVIAR'}
                </button>
              </div>
            </div>
          )}

          {step === FormStep.SUCCESS && (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl"><i className="fas fa-check"></i></div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Sucesso!</h2>
              <div className="text-slate-500 space-y-2">
                <p>Seus dados e fotos foram salvos com segurança.</p>
                <p className="font-bold text-slate-800">Em breve você receberá o link para assinatura do contrato.</p>
              </div>
              <button onClick={() => window.location.reload()} className="px-10 py-4 bg-slate-800 text-white font-bold rounded-xl">Novo Cadastro</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

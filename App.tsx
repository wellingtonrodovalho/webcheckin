
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
      propertyId: '3', // Default Crystal Place
      totalValue: 0
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

  useEffect(() => {
    if (formData.reservation.guestCount > selectedProperty.capacity) {
      setFormData(prev => ({
        ...prev,
        reservation: { ...prev.reservation, guestCount: selectedProperty.capacity }
      }));
    }
  }, [formData.reservation.propertyId]);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleReservationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      reservation: {
        ...prev.reservation,
        [name]: name === 'guestCount' || name === 'totalValue' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const handlePetChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({
      ...prev,
      pet: {
        ...prev.pet,
        [name]: val
      }
    }));
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
      setFormData(prev => ({
        ...prev,
        mainGuest: { ...prev.mainGuest, documentFile: base64 }
      }));
    } else if (role === 'pet') {
      setFormData(prev => ({
        ...prev,
        pet: { ...prev.pet, vaccineFile: base64 }
      }));
    } else if (index !== undefined) {
      const newCompanions = [...formData.companions];
      newCompanions[index] = { ...newCompanions[index], documentFile: base64 };
      setFormData(prev => ({ ...prev, companions: newCompanions }));
    }
  };

  const handleSelfieCapture = (base64: string) => {
    setFormData(prev => ({
      ...prev,
      mainGuest: { ...prev.mainGuest, selfieFile: base64 }
    }));
  };

  const finalizeProcess = async () => {
    if (formData.reservation.totalValue <= 0) {
      alert("Por favor, informe o valor total da reserva antes de finalizar.");
      return;
    }
    
    setLoading(true);
    try {
      await saveToGoogleSheets(formData);
      setStep(FormStep.SUCCESS);
    } catch (error) {
      console.error("Erro na finalização:", error);
      alert("Erro ao finalizar processo. Os dados podem não ter sido salvos corretamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50 flex flex-col font-['Nunito']">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Logo className="w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0" />
              <div>
                <h1 className="font-black text-slate-800 text-base sm:text-xl lg:text-2xl leading-tight uppercase tracking-tight">
                  WELLINGTON RODOVALHO FONSECA
                </h1>
                <p className="text-[9px] sm:text-[11px] text-blue-600 font-bold uppercase tracking-[0.15em] mt-0.5">
                  Corretagem no aluguel de imóveis
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:flex lg:flex-row gap-x-4 gap-y-2 text-[10px] sm:text-[11px] text-slate-500 font-semibold border-t lg:border-t-0 pt-3 lg:pt-0">
              <div className="flex flex-col lg:items-end">
                <span className="text-slate-400 text-[8px] uppercase">CRECI</span>
                <span className="text-slate-800">GO 42695</span>
              </div>
              <div className="flex flex-col lg:items-end">
                <span className="text-slate-400 text-[8px] uppercase">CNAI</span>
                <span className="text-slate-800">54826</span>
              </div>
              <div className="flex flex-col lg:items-end">
                <span className="text-slate-400 text-[8px] uppercase">CPF</span>
                <span className="text-slate-800">269.462.701-34</span>
              </div>
              <div className="flex flex-col lg:items-end">
                <span className="text-slate-400 text-[8px] uppercase">CAEPF</span>
                <span className="text-slate-800">269.462.701/001-49</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-8">
        {step > FormStep.CONSENT && step !== FormStep.SUCCESS && (
          <div className="mb-4 sm:mb-8 overflow-x-auto">
            <StepIndicator currentStep={step} />
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 p-5 sm:p-8 lg:p-12 transition-all duration-500 overflow-hidden">
          
          {step === FormStep.CONSENT && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm mb-2 p-4">
                  <Logo className="w-full h-full" />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 leading-tight">Gestão de Reserva e Contrato</h2>
                <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  Para dar sequência em sua reserva, em conformidade com a LGPD (Lei 13.709/2018).
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-100 space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm sm:text-base">
                  <i className="fas fa-info-circle text-blue-500"></i> Segurança e Transparência
                </h3>
                <div className="text-[11px] sm:text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>Os dados coletados são essenciais para o seu cadastro de hóspede e para a elaboração do contrato de locação por temporada que será enviado pela nossa equipe.</p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <label className="flex items-start gap-3 sm:gap-4 p-4 bg-blue-50/50 rounded-xl sm:rounded-2xl border border-blue-100/50 cursor-pointer hover:bg-blue-100 transition-all active:scale-[0.99]">
                  <div className="mt-0.5">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 transition-all"
                      checked={formData.lgpdConsent}
                      onChange={(e) => setFormData(prev => ({ ...prev, lgpdConsent: e.target.checked }))}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-900">Concordo com o Tratamento de Dados</p>
                    <p className="text-[10px] sm:text-[11px] text-blue-700 mt-1">Autorizo o uso dos meus dados para fins de reserva e contrato.</p>
                  </div>
                </label>

                <button
                  onClick={nextStep}
                  disabled={!formData.lgpdConsent}
                  className="w-full py-4 sm:py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-xl sm:rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-[0.97]"
                >
                  Continuar Cadastro <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {step === FormStep.RESERVATION && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Detalhes da Estadia</h2>
              </div>

              <div className="space-y-4">
                <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">Imóvel da Reserva</label>
                <select
                  name="propertyId"
                  value={formData.reservation.propertyId}
                  onChange={handleReservationChange}
                  className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base font-bold text-blue-900"
                >
                  {PROPERTIES.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Cap. {p.capacity})</option>
                  ))}
                </select>
                {selectedProperty?.petAllowed ? (
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider"><i className="fas fa-paw mr-1"></i> Este imóvel PERMITE pets</p>
                ) : (
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider"><i className="fas fa-ban mr-1"></i> Este imóvel NÃO permite pets</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">Entrada</label>
                  <input type="date" name="startDate" value={formData.reservation.startDate} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">Saída</label>
                  <input type="date" name="endDate" value={formData.reservation.endDate} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">Hóspedes (Máx {selectedProperty.capacity})</label>
                  <select name="guestCount" value={formData.reservation.guestCount} onChange={handleReservationChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {Array.from({ length: selectedProperty.capacity }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Pessoa' : 'Pessoas'}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">Valor Total (R$)</label>
                  <input type="number" name="totalValue" value={formData.reservation.totalValue || ''} onChange={handleReservationChange} placeholder="0.00" className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl font-black text-blue-700" />
                </div>
              </div>

              {selectedProperty?.petAllowed && (
                <div className="p-5 sm:p-8 bg-blue-50/30 border border-blue-100 rounded-[2rem] space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><i className="fas fa-paw"></i></div>
                      <h3 className="font-black text-blue-900 uppercase text-sm sm:text-base">Informações do Pet</h3>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="hasPet" checked={formData.pet.hasPet} onChange={handlePetChange} className="sr-only peer" />
                      <div className="relative w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      <span className="ms-3 text-sm font-bold text-blue-900">Trarei Pet</span>
                    </label>
                  </div>

                  {formData.pet.hasPet && (
                    <div className="grid gap-5 animate-in fade-in slide-in-from-top-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input name="name" value={formData.pet.name} onChange={handlePetChange} className="w-full px-4 py-3 border border-blue-100 rounded-xl text-sm" placeholder="Nome do Pet" />
                        <input name="breed" value={formData.pet.breed} onChange={handlePetChange} className="w-full px-4 py-3 border border-blue-100 rounded-xl text-sm" placeholder="Raça" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <select name="species" value={formData.pet.species} onChange={handlePetChange} className="w-full px-4 py-3 border border-blue-100 rounded-xl text-sm">
                          <option value="Canino">Canino</option>
                          <option value="Felino">Felino</option>
                        </select>
                        <input name="weight" value={formData.pet.weight} onChange={handlePetChange} className="w-full px-4 py-3 border border-blue-100 rounded-xl text-sm" placeholder="Peso" />
                        <input name="age" value={formData.pet.age} onChange={handlePetChange} className="w-full px-4 py-3 border border-blue-100 rounded-xl text-sm" placeholder="Idade" />
                        <select name="size" value={formData.pet.size} onChange={handlePetChange} className="w-full px-4 py-3 border border-blue-100 rounded-xl text-sm">
                          <option value="Pequeno">Pequeno</option>
                          <option value="Médio">Médio</option>
                        </select>
                      </div>
                      <FileUpload id="pet_vaccine" label="Cartão de Vacina (Obrigatório)" onFileSelect={handleDocumentUpload('pet')} />
                    </div>
                  )}
                </div>
              )}

              <button onClick={nextStep} disabled={!formData.reservation.startDate || !formData.reservation.endDate} className="w-full py-4 sm:py-5 bg-blue-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                Próxima Etapa <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}

          {step === FormStep.MAIN_GUEST && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Dados do Titular</h2>
              </div>

              <div className="grid gap-5">
                <input name="fullName" value={formData.mainGuest.fullName} onChange={handleMainGuestChange} placeholder="Nome Completo" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <select name="maritalStatus" value={formData.mainGuest.maritalStatus} onChange={handleMainGuestChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Estado Civil</option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                    <option value="União Estável">União Estável</option>
                  </select>
                  <input name="profession" value={formData.mainGuest.profession} onChange={handleMainGuestChange} placeholder="Profissão" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <input name="cpf" value={formData.mainGuest.cpf} onChange={handleMainGuestChange} placeholder="CPF" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  <input name="rg" value={formData.mainGuest.rg} onChange={handleMainGuestChange} placeholder="RG" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <input name="email" value={formData.mainGuest.email} onChange={handleMainGuestChange} placeholder="E-mail" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  <input name="phone" value={formData.mainGuest.phone} onChange={handleMainGuestChange} placeholder="Telefone / WhatsApp" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>

                <textarea name="address" rows={2} value={formData.mainGuest.address} onChange={handleMainGuestChange} placeholder="Endereço Residencial Completo" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none"></textarea>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
                  <FileUpload id="main_doc" label="Foto do Documento (Frente)" onFileSelect={handleDocumentUpload('main')} />
                  <SelfieCapture label="Selfie para Verificação" onCapture={handleSelfieCapture} />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8">
                <button onClick={prevStep} className="w-full sm:flex-1 py-4 bg-slate-100 font-bold rounded-xl">Voltar</button>
                <button onClick={nextStep} disabled={!formData.mainGuest.fullName || !formData.mainGuest.documentFile || !formData.mainGuest.selfieFile} className="w-full sm:flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl">Próxima Etapa</button>
              </div>
            </div>
          )}

          {step === FormStep.COMPANIONS && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="border-b border-slate-100 pb-4"><h2 className="text-xl sm:text-2xl font-bold text-slate-800">Acompanhantes</h2></div>
              {formData.reservation.guestCount <= 1 ? (
                <div className="py-16 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium">Reserva individual selecionada. Nenhum acompanhante necessário.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Array.from({ length: formData.reservation.guestCount - 1 }).map((_, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">{idx + 1}</span><h3 className="font-bold text-slate-700">Hóspede Adicional</h3></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input placeholder="Nome Completo" value={formData.companions[idx]?.name || ''} onChange={(e) => handleCompanionChange(idx, 'name', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" />
                        <input placeholder="CPF ou RG" value={formData.companions[idx]?.documentNumber || ''} onChange={(e) => handleCompanionChange(idx, 'documentNumber', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8">
                <button onClick={prevStep} className="w-full sm:flex-1 py-4 bg-slate-100 font-bold rounded-xl">Voltar</button>
                <button onClick={finalizeProcess} disabled={loading} className="w-full sm:flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                  {loading ? <><i className="fas fa-circle-notch fa-spin"></i> Enviando...</> : 'Finalizar e Enviar Cadastro'}
                </button>
              </div>
            </div>
          )}

          {step === FormStep.SUCCESS && (
            <div className="text-center py-16 space-y-8 animate-in zoom-in">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><i className="fas fa-check text-4xl"></i></div>
              <h2 className="text-3xl font-black text-slate-800">Tudo Pronto!</h2>
              <div className="space-y-2 text-slate-500 max-w-sm mx-auto">
                <p>Seu cadastro foi recebido com sucesso.</p>
                <p className="font-bold text-slate-700">A nossa equipe irá gerar o seu contrato e enviá-lo para assinatura em breve.</p>
              </div>
              <button onClick={() => window.location.reload()} className="px-10 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">Novo Cadastro</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

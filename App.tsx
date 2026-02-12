
import React, { useState } from 'react';
import { FormStep, FullFormData } from './types';
import { generateContract } from './services/geminiService';
import { saveToGoogleSheets, sendToAutentique } from './services/externalServices';
import StepIndicator from './components/StepIndicator';
import FileUpload from './components/FileUpload';
import SelfieCapture from './components/SelfieCapture';
import Logo from './components/Logo';

const simulatePdfGeneration = (text: string) => {
  return btoa(unescape(encodeURIComponent(text)));
};

const App: React.FC = () => {
  const [step, setStep] = useState<FormStep>(FormStep.CONSENT);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FullFormData>({
    reservation: {
      startDate: '',
      endDate: '',
      guestCount: 1,
      reasonForVisit: 'Turismo',
      propertyAddress: 'Rua 4, Edifício Crystal, Setor Oeste, Goiânia - GO',
      dailyRate: 250
    },
    mainGuest: {
      fullName: '',
      cpf: '',
      rg: '',
      email: '',
      phone: '',
      address: ''
    },
    companions: [],
    lgpdConsent: false
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleReservationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      reservation: {
        ...prev.reservation,
        [name]: name === 'guestCount' ? parseInt(value) : value
      }
    }));
  };

  const handleMainGuestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleDocumentUpload = (role: 'main' | 'companion', index?: number) => (base64: string) => {
    if (role === 'main') {
      setFormData(prev => ({
        ...prev,
        mainGuest: { ...prev.mainGuest, documentFile: base64 }
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

  const processContract = async () => {
    setLoading(true);
    try {
      const text = await generateContract(formData);
      setFormData(prev => ({ ...prev, contractText: text }));
      nextStep();
    } catch (error) {
      alert("Houve um erro ao gerar o contrato. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const finalizeProcess = async () => {
    setLoading(true);
    try {
      await saveToGoogleSheets(formData);
      const pdfBase64 = simulatePdfGeneration(formData.contractText || "");
      await sendToAutentique(pdfBase64, formData.mainGuest.email, formData.mainGuest.fullName);
      setStep(FormStep.SUCCESS);
    } catch (error) {
      alert("Erro ao finalizar processo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50 flex flex-col">
      {/* Responsive Header Section */}
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
          
          <div className="mt-3 pt-3 border-t border-slate-50 hidden sm:flex flex-col md:flex-row md:items-center justify-between gap-2">
            <p className="text-[9px] text-slate-400 leading-tight italic">
              CNAE: 6821-8/02 - Corretagem no aluguel de imóveis
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">
              <i className="fas fa-map-marker-alt mr-1.5 text-blue-400"></i>
              Rua 1, Qd. 9, Lt. 22, Casa 2, Jd. Santo Antônio, Goiânia-GO, CEP 74.853-130
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-8">
        {step > FormStep.CONSENT && step !== FormStep.SUCCESS && (
          <div className="mb-4 sm:mb-8 overflow-x-auto">
            <StepIndicator currentStep={step} />
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 p-5 sm:p-8 lg:p-12 transition-all duration-500 overflow-hidden">
          
          {/* STEP -1: LGPD CONSENT */}
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
                  <p className="font-medium text-slate-800">Este formulário é multiuso:</p>
                  <p>Os dados coletados são essenciais para o seu cadastro de hóspede e para a eventual elaboração do contrato de locação por temporada, garantindo agilidade e segurança jurídica.</p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <p>1. <strong>Finalidade:</strong> Cadastro de segurança e elaboração de contrato (Lei 8.245/91).</p>
                    <p>2. <strong>Controlador:</strong> Wellington R. Fonseca, responsável técnico.</p>
                  </div>
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
                    <p className="text-[10px] sm:text-[11px] text-blue-700 mt-1">Autorizo o uso dos meus dados para fins de reserva, cadastro e eventual contrato.</p>
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

          {/* STEP 0: RESERVATION */}
          {step === FormStep.RESERVATION && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Detalhes da Estadia</h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">Dados da reserva para o imóvel em Goiânia.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">Data de Entrada</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.reservation.startDate}
                    onChange={handleReservationChange}
                    className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">Data de Saída</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.reservation.endDate}
                    onChange={handleReservationChange}
                    className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">Hóspedes</label>
                  <select
                    name="guestCount"
                    value={formData.reservation.guestCount}
                    onChange={handleReservationChange}
                    className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none text-sm sm:text-base"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Pessoa' : 'Pessoas'}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">Motivo da Vinda</label>
                  <select
                    name="reasonForVisit"
                    value={formData.reservation.reasonForVisit}
                    onChange={handleReservationChange}
                    className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none text-sm sm:text-base"
                  >
                    <option value="Turismo">Turismo</option>
                    <option value="Trabalho">Trabalho / Evento</option>
                    <option value="Saúde">Saúde (Clínicas/Hospitais)</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 sm:p-6 rounded-2xl border border-blue-100 flex flex-col sm:flex-row gap-4">
                <div className="text-blue-500 text-2xl"><i className="fas fa-car"></i></div>
                <div className="flex-1 space-y-4">
                  <p className="text-sm font-bold text-blue-900">Veículo para Acesso ao Estacionamento (Opcional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <input
                      placeholder="Modelo (Ex: HB20)"
                      name="vehicleModel"
                      value={formData.reservation.vehicleModel}
                      onChange={handleReservationChange}
                      className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm"
                    />
                    <input
                      placeholder="Placa"
                      name="vehiclePlate"
                      value={formData.reservation.vehiclePlate}
                      onChange={handleReservationChange}
                      className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm uppercase"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!formData.reservation.startDate || !formData.reservation.endDate}
                className="w-full py-4 sm:py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Próxima Etapa <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}

          {/* STEP 1: MAIN GUEST */}
          {step === FormStep.MAIN_GUEST && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Dados do Titular</h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">Responsável pela reserva e eventual contrato.</p>
              </div>

              <div className="grid gap-5 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">Nome Completo</label>
                  <input
                    name="fullName"
                    value={formData.mainGuest.fullName}
                    onChange={handleMainGuestChange}
                    placeholder="Conforme documento"
                    className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">CPF</label>
                    <input
                      name="cpf"
                      value={formData.mainGuest.cpf}
                      onChange={handleMainGuestChange}
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">RG</label>
                    <input
                      name="rg"
                      value={formData.mainGuest.rg}
                      onChange={handleMainGuestChange}
                      placeholder="Número"
                      className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">E-mail</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.mainGuest.email}
                      onChange={handleMainGuestChange}
                      placeholder="exemplo@email.com"
                      className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">WhatsApp</label>
                    <input
                      name="phone"
                      value={formData.mainGuest.phone}
                      onChange={handleMainGuestChange}
                      placeholder="(62) 9 9999-9999"
                      className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">Endereço Residencial</label>
                  <textarea
                    name="address"
                    rows={2}
                    value={formData.mainGuest.address}
                    onChange={handleMainGuestChange}
                    className="w-full px-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl resize-none text-sm sm:text-base"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <FileUpload
                    id="main_doc"
                    label="Foto do Documento (Frente/Verso)"
                    onFileSelect={handleDocumentUpload('main')}
                  />
                  <SelfieCapture 
                    label="Selfie para Verificação" 
                    onCapture={handleSelfieCapture} 
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8">
                <button
                  onClick={prevStep}
                  className="w-full sm:flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all active:scale-[0.98]"
                >
                  Voltar
                </button>
                <button
                  onClick={nextStep}
                  disabled={!formData.mainGuest.fullName || !formData.mainGuest.email || !formData.mainGuest.documentFile || !formData.mainGuest.selfieFile}
                  className="w-full sm:flex-[2] py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Próxima Etapa <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COMPANIONS */}
          {step === FormStep.COMPANIONS && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Acompanhantes</h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Cadastre as {formData.reservation.guestCount - 1} pessoas extras da reserva.
                </p>
              </div>

              {formData.reservation.guestCount <= 1 ? (
                <div className="py-16 text-center bg-slate-50 rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200">
                  <i className="fas fa-user-plus text-slate-300 text-5xl mb-4"></i>
                  <p className="text-slate-500 font-medium px-8 text-sm sm:text-base">Nenhum acompanhante cadastrado. Reserva individual.</p>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  {Array.from({ length: formData.reservation.guestCount - 1 }).map((_, idx) => (
                    <div key={idx} className="p-5 sm:p-8 bg-slate-50 rounded-2xl border border-slate-100 space-y-5">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-slate-700 text-sm sm:text-base uppercase tracking-wide">Acompanhante</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          placeholder="Nome Completo"
                          value={formData.companions[idx]?.name || ''}
                          onChange={(e) => handleCompanionChange(idx, 'name', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm"
                        />
                        <input
                          placeholder="CPF ou RG"
                          value={formData.companions[idx]?.documentNumber || ''}
                          onChange={(e) => handleCompanionChange(idx, 'documentNumber', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm"
                        />
                      </div>
                      <FileUpload
                        id={`comp_doc_${idx}`}
                        label={`Foto do Documento (Opcional)`}
                        onFileSelect={handleDocumentUpload('companion', idx)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8">
                <button
                  onClick={prevStep}
                  className="w-full sm:flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={processContract}
                  className="w-full sm:flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Preparando...</>
                  ) : (
                    <><i className="fas fa-file-invoice"></i> Gerar Resumo/Contrato</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONTRACT PREVIEW */}
          {step === FormStep.CONTRACT_PREVIEW && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Finalização</h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">Revise os dados e o contrato gerado.</p>
              </div>

              <div className="prose prose-sm sm:prose-base prose-slate max-w-none bg-slate-50 p-4 sm:p-8 rounded-2xl border border-slate-200 h-[400px] sm:h-[500px] overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap font-serif shadow-inner">
                {formData.contractText}
              </div>

              <div className="bg-amber-50 p-4 sm:p-6 rounded-xl border border-amber-100 flex gap-4 items-start">
                <i className="fas fa-info-circle text-amber-500 text-xl mt-0.5"></i>
                <p className="text-[11px] sm:text-sm text-amber-800 leading-normal">
                  Ao clicar em <strong>Finalizar e Enviar</strong>, os dados serão registrados e, caso necessário, uma cópia deste contrato será enviada para o e-mail: <br/>
                  <span className="font-bold underline decoration-amber-300">{formData.mainGuest.email}</span>.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8">
                <button
                  onClick={prevStep}
                  className="w-full sm:flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                >
                  Corrigir
                </button>
                <button
                  onClick={finalizeProcess}
                  disabled={loading}
                  className="w-full sm:flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Processando...</>
                  ) : (
                    <><i className="fas fa-signature"></i> Finalizar e Enviar</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === FormStep.SUCCESS && (
            <div className="text-center py-10 sm:py-16 space-y-6 sm:space-y-8 animate-in zoom-in duration-500">
              <div className="w-20 h-20 sm:w-28 sm:h-28 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <i className="fas fa-check text-4xl sm:text-5xl"></i>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl sm:text-4xl font-black text-slate-800">Sucesso!</h2>
                <p className="text-slate-500 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
                  Sua reserva e cadastro foram realizados com sucesso por Wellington Rodovalho Fonseca.
                </p>
              </div>
              
              <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl inline-block border border-slate-200 space-y-2">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Protocolo WRF</p>
                <code className="text-blue-600 font-mono font-black text-lg sm:text-2xl tracking-tighter">
                  WRF-{Math.floor(Math.random()*900000)+100000}
                </code>
              </div>

              <div className="pt-6 sm:pt-10">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto px-10 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all active:scale-[0.98]"
                >
                  Novo Cadastro
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info - Always Responsive */}
        <footer className="mt-8 mb-4 text-center px-4">
          <div className="flex flex-col items-center gap-4">
             <Logo className="w-8 h-8 opacity-40" />
             <div className="space-y-1">
                <p className="text-slate-800 font-bold text-[10px] sm:text-xs uppercase tracking-wider">Responsável Técnico</p>
                <p className="text-slate-600 text-[10px] sm:text-[11px] font-medium uppercase">
                  WELLINGTON RODOVALHO FONSECA | CRECI-GO 42695 | CNAI 54826
                </p>
             </div>
             <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-slate-400 text-[9px] sm:text-[10px] font-medium border-t border-slate-200 pt-4 w-full">
                <span className="flex items-center gap-1.5"><i className="fas fa-lock text-blue-400/50"></i> LGPD Compliant</span>
                <span className="flex items-center gap-1.5"><i className="fas fa-shield-alt text-blue-400/50"></i> Secure Connection</span>
                <span className="flex items-center gap-1.5"><i className="fas fa-copyright text-blue-400/50"></i> 2024 Wellington R. Fonseca</span>
             </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;


import React, { useState } from 'react';
import { FormStep, FullFormData } from './types';
import { generateContract } from './services/geminiService';
import { saveToGoogleSheets, sendToAutentique } from './services/externalServices';
import StepIndicator from './components/StepIndicator';
import FileUpload from './components/FileUpload';
import SelfieCapture from './components/SelfieCapture';
import Logo from './components/Logo';

// Utility to generate PDF (simulated for browser environment)
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
    <div className="min-h-screen pb-12 bg-slate-50">
      {/* Professional Header Section */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo className="w-14 h-14" />
              <div>
                <h1 className="font-black text-slate-800 text-xl leading-tight uppercase">WELLINGTON RODOVALHO FONSECA</h1>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Corretagem no aluguel de imóveis</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-slate-500 font-medium md:text-right">
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold uppercase">CRECI:</span>
                <span className="text-slate-800">GO 42695</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold uppercase">CNAI:</span>
                <span className="text-slate-800">54826</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold uppercase">CPF:</span>
                <span className="text-slate-800">269.462.701-34</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold uppercase">CAEPF:</span>
                <span className="text-slate-800">269.462.701/001-49</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <p className="text-[9px] text-slate-400 leading-tight italic">
              CNAE: 6821-8/02 - Corretagem no aluguel de imóveis
            </p>
            <p className="text-[9px] text-slate-400 leading-tight">
              <i className="fas fa-map-marker-alt mr-1"></i>
              Rua 1, Quadra 9, Lote 22, Casa 2, Jardim Santo Antônio, Goiânia-GO, CEP 74.853-130
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-4">
        {step > FormStep.CONSENT && step !== FormStep.SUCCESS && <StepIndicator currentStep={step} />}

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* STEP -1: LGPD CONSENT */}
          {step === FormStep.CONSENT && (
            <div className="space-y-8 py-4">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm mb-2">
                  <Logo className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Gestão de Reserva e Contrato</h2>
                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                  Para dar sequência em sua reserva, em conformidade com a LGPD (Lei 13.709/2018).
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <i className="fas fa-info-circle text-blue-500"></i> Segurança e Transparência
                </h3>
                <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                  <p>Este formulário é multiuso: os dados coletados são essenciais para o seu cadastro de hóspede e para a eventual elaboração do contrato de locação por temporada, garantindo agilidade e segurança jurídica.</p>
                  <p>1. <strong>Finalidade:</strong> Coleta de informações necessárias para reserva, cadastro de segurança e elaboração de contrato (Lei 8.245/91).</p>
                  <p>2. <strong>Controlador:</strong> Wellington Rodovalho Fonseca (CRECI-GO 42695), responsável técnico pelo tratamento dos dados.</p>
                  <p>3. <strong>Retenção:</strong> Os dados serão mantidos conforme exigências legais para fins de registro e validade contratual.</p>
                  <p>4. <strong>Verificação:</strong> A selfie é solicitada como prova de vida e confirmação de identidade contra fraudes.</p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <label className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer hover:bg-blue-100/50 transition-colors">
                  <div className="mt-1">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      checked={formData.lgpdConsent}
                      onChange={(e) => setFormData(prev => ({ ...prev, lgpdConsent: e.target.checked }))}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-900 leading-tight">Concordo com o Tratamento de Dados</p>
                    <p className="text-[11px] text-blue-700 mt-1">Autorizo expressamente o uso dos meus dados para fins de reserva, cadastro e eventual contrato.</p>
                  </div>
                </label>

                <button
                  onClick={nextStep}
                  disabled={!formData.lgpdConsent}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  Continuar Cadastro <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* STEP 0: RESERVATION */}
          {step === FormStep.RESERVATION && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Detalhes da Estadia</h2>
                <p className="text-slate-500 text-sm mt-1">Informe os dados da reserva do seu imóvel em Goiânia.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Data de Entrada (Check-in)</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.reservation.startDate}
                    onChange={handleReservationChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Data de Saída (Check-out)</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.reservation.endDate}
                    onChange={handleReservationChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Total de Hóspedes</label>
                  <select
                    name="guestCount"
                    value={formData.reservation.guestCount}
                    onChange={handleReservationChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Pessoa' : 'Pessoas'}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Motivo da Vinda</label>
                  <select
                    name="reasonForVisit"
                    value={formData.reservation.reasonForVisit}
                    onChange={handleReservationChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                  >
                    <option value="Turismo">Turismo</option>
                    <option value="Trabalho">Trabalho / Evento</option>
                    <option value="Saúde">Saúde (Clínicas/Hospitais)</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex gap-4">
                <div className="text-blue-500 text-xl mt-1"><i className="fas fa-car"></i></div>
                <div className="flex-1 space-y-4">
                  <p className="text-sm font-bold text-blue-900">Informações do Veículo (Opcional)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      placeholder="Modelo do Carro (Ex: HB20)"
                      name="vehicleModel"
                      value={formData.reservation.vehicleModel}
                      onChange={handleReservationChange}
                      className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg text-sm"
                    />
                    <input
                      placeholder="Placa do Carro"
                      name="vehiclePlate"
                      value={formData.reservation.vehiclePlate}
                      onChange={handleReservationChange}
                      className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg text-sm uppercase"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!formData.reservation.startDate || !formData.reservation.endDate}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 mt-4"
              >
                Próxima Etapa <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}

          {/* STEP 1: MAIN GUEST */}
          {step === FormStep.MAIN_GUEST && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Dados do Titular</h2>
                <p className="text-slate-500 text-sm mt-1">Responsável pela reserva e eventual contrato.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nome Completo</label>
                  <input
                    name="fullName"
                    value={formData.mainGuest.fullName}
                    onChange={handleMainGuestChange}
                    placeholder="Como no documento"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">CPF</label>
                    <input
                      name="cpf"
                      value={formData.mainGuest.cpf}
                      onChange={handleMainGuestChange}
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">RG</label>
                    <input
                      name="rg"
                      value={formData.mainGuest.rg}
                      onChange={handleMainGuestChange}
                      placeholder="Número do documento"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">E-mail</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.mainGuest.email}
                      onChange={handleMainGuestChange}
                      placeholder="Para comunicação e assinaturas"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">WhatsApp / Celular</label>
                    <input
                      name="phone"
                      value={formData.mainGuest.phone}
                      onChange={handleMainGuestChange}
                      placeholder="(62) 9 9999-9999"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Endereço Residencial</label>
                  <textarea
                    name="address"
                    rows={2}
                    value={formData.mainGuest.address}
                    onChange={handleMainGuestChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
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

              <div className="flex gap-4 mt-8">
                <button
                  onClick={prevStep}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={nextStep}
                  disabled={!formData.mainGuest.fullName || !formData.mainGuest.email || !formData.mainGuest.documentFile || !formData.mainGuest.selfieFile}
                  className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  Próxima Etapa <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COMPANIONS */}
          {step === FormStep.COMPANIONS && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Acompanhantes</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Cadastre as {formData.reservation.guestCount - 1} pessoas extras da sua reserva.
                </p>
              </div>

              {formData.reservation.guestCount <= 1 ? (
                <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <i className="fas fa-user-plus text-slate-300 text-5xl mb-4"></i>
                  <p className="text-slate-500 font-medium px-8">Sem acompanhantes nesta reserva. Apenas o titular.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Array.from({ length: formData.reservation.guestCount - 1 }).map((_, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-slate-700">Dados do Acompanhante</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          placeholder="Nome Completo"
                          value={formData.companions[idx]?.name || ''}
                          onChange={(e) => handleCompanionChange(idx, 'name', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl"
                        />
                        <input
                          placeholder="CPF ou RG"
                          value={formData.companions[idx]?.documentNumber || ''}
                          onChange={(e) => handleCompanionChange(idx, 'documentNumber', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                      <FileUpload
                        id={`comp_doc_${idx}`}
                        label={`Documento do Acompanhante ${idx + 1}`}
                        onFileSelect={handleDocumentUpload('companion', idx)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <button
                  onClick={prevStep}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={processContract}
                  className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Preparando Resumo...</>
                  ) : (
                    <><i className="fas fa-file-invoice"></i> Gerar Resumo/Contrato</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONTRACT PREVIEW */}
          {step === FormStep.CONTRACT_PREVIEW && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-2xl font-bold text-slate-800">Finalização</h2>
                <p className="text-slate-500 text-sm mt-1">Revise os dados e o contrato gerado conforme a legislação.</p>
              </div>

              <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-2xl border border-slate-200 h-96 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap font-serif">
                {formData.contractText}
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 items-start">
                <i className="fas fa-info-circle text-amber-500 mt-1"></i>
                <p className="text-xs text-amber-800 leading-tight">
                  Ao clicar em <strong>Finalizar e Enviar</strong>, os dados serão registrados e, caso necessário, uma cópia deste contrato será enviada para o e-mail: <br/>
                  <span className="font-bold underline">{formData.mainGuest.email}</span>.
                </p>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={prevStep}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                >
                  Corrigir Dados
                </button>
                <button
                  onClick={finalizeProcess}
                  disabled={loading}
                  className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
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
            <div className="text-center py-12 space-y-6 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <i className="fas fa-check text-4xl"></i>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-800">Tudo Pronto!</h2>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Sua reserva e cadastro foram realizados com sucesso por Wellington Rodovalho Fonseca.
                </p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl inline-block border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Protocolo de Registro</p>
                <code className="text-blue-600 font-mono font-bold">WRF-{Math.floor(Math.random()*900000)+100000}</code>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all"
                >
                  Novo Cadastro
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Footer Info */}
        <div className="mt-8 text-center border-t border-slate-200 pt-6">
          <p className="text-slate-800 font-bold text-[10px] uppercase mb-1">Responsável Técnico</p>
          <p className="text-slate-600 text-[10px] font-medium">WELLINGTON RODOVALHO FONSECA | CRECI-GO 42695 | CNAI 54826</p>
          <p className="text-slate-400 text-[9px] flex items-center justify-center gap-2 mt-2">
            <i className="fas fa-lock text-blue-400"></i> Dados processados em ambiente seguro e criptografado (LGPD Compliant)
          </p>
          <p className="text-slate-400 text-[9px] mt-1">
            © 2024 Wellington Rodovalho Fonseca - Todos os direitos reservados.
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;

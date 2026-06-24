
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
  
  const [formData, setFormData] = useState<FullFormData>({
    reservation: {
      startDate: '',
      endDate: '',
      guestCount: 1,
      reasonForVisit: 'Férias/Lazer',
      hasVehicle: false,
      vehicleBrand: '',
      vehicleModel: '',
      vehicleColor: '',
      vehiclePlate: '',
      propertyId: '3',
      totalValue: 0,
      securityDepositValue: 0,
      hasSecurityDeposit: false,
      bookingSource: ''
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
      addressStreet: '',
      addressComplement: '',
      addressDistrict: '',
      addressCityState: '',
      addressZipCode: '',
      maritalStatus: '',
      profession: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: ''
    },
    companions: [],
    lgpdConsent: false
  });

  const selectedProperty = PROPERTIES.find(p => p.id === formData.reservation.propertyId) || PROPERTIES[0];
  const isPetAllowedProperty = selectedProperty.petAllowed;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const nextStep = () => {
    if (step === FormStep.MAIN_GUEST && !isPetAllowedProperty) {
      setStep(FormStep.COMPANIONS);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (step === FormStep.COMPANIONS && !isPetAllowedProperty) {
      setStep(FormStep.MAIN_GUEST);
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleReservationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => {
      const nextReservation = {
        ...prev.reservation,
        [name]: (name === 'guestCount' || name === 'totalValue' || name === 'securityDepositValue') 
          ? (value === '' ? 0 : parseFloat(value)) 
          : val
      };
      
      let nextPet = prev.pet;
      if (name === 'propertyId') {
        const targetProp = PROPERTIES.find(p => p.id === value);
        const isPetAllowed = targetProp ? targetProp.petAllowed : false;
        if (!isPetAllowed) {
          nextPet = { ...prev.pet, hasPet: false };
        }
      }

      return {
        ...prev,
        reservation: nextReservation,
        pet: nextPet
      };
    });
  };

  const [searchingCep, setSearchingCep] = useState(false);
  const [cepError, setCepError] = useState('');

  const lookupCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepError('CEP inválido (deve ter 8 dígitos)');
      return;
    }
    setSearchingCep(true);
    setCepError('');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data.erro) {
        setCepError('CEP não encontrado nos Correios');
      } else {
        setFormData(prev => {
          const updatedGuest = {
            ...prev.mainGuest,
            addressStreet: data.logradouro || '',
            addressDistrict: data.bairro || '',
            addressCityState: `${data.localidade} - ${data.uf}`,
            addressZipCode: data.cep || cepValue
          };
          
          const parts = [];
          if (updatedGuest.addressStreet) parts.push(updatedGuest.addressStreet);
          if (updatedGuest.addressComplement) parts.push(updatedGuest.addressComplement);
          if (updatedGuest.addressDistrict) parts.push(`Bairro: ${updatedGuest.addressDistrict}`);
          if (updatedGuest.addressCityState) parts.push(updatedGuest.addressCityState);
          if (updatedGuest.addressZipCode) parts.push(`CEP: ${updatedGuest.addressZipCode}`);
          updatedGuest.address = parts.join(', ');
          
          return { ...prev, mainGuest: updatedGuest };
        });
      }
    } catch (err) {
      setCepError('Erro ao buscar CEP');
    } finally {
      setSearchingCep(false);
    }
  };

  const handleMainGuestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedGuest = { ...prev.mainGuest, [name]: value };
      
      if (['addressStreet', 'addressComplement', 'addressDistrict', 'addressCityState', 'addressZipCode'].includes(name)) {
        const parts = [];
        if (updatedGuest.addressStreet) parts.push(updatedGuest.addressStreet);
        if (updatedGuest.addressComplement) parts.push(updatedGuest.addressComplement);
        if (updatedGuest.addressDistrict) parts.push(`Bairro: ${updatedGuest.addressDistrict}`);
        if (updatedGuest.addressCityState) parts.push(updatedGuest.addressCityState);
        if (updatedGuest.addressZipCode) parts.push(`CEP: ${updatedGuest.addressZipCode}`);
        updatedGuest.address = parts.join(', ');
      }
      
      return { ...prev, mainGuest: updatedGuest };
    });
  };

  const handlePetToggle = (hasPet: boolean) => {
    setFormData(prev => ({ ...prev, pet: { ...prev.pet, hasPet: isPetAllowedProperty ? hasPet : false } }));
  };

  const handlePetChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, pet: { ...prev.pet, [name]: value } }));
  };

  const handleCompanionChange = (index: number, name: string, value: string) => {
    const newCompanions = [...formData.companions];
    if (!newCompanions[index]) {
      newCompanions[index] = { 
        id: Math.random().toString(), 
        name: '', 
        rg: '', 
        cpf: '', 
        email: '', 
        phone: '', 
        documentNumber: '' 
      };
    }
    newCompanions[index] = { ...newCompanions[index], [name]: value };
    // Mapeamento de compatibilidade para documentNumber
    if (name === 'cpf') {
      newCompanions[index].documentNumber = value;
    } else if (name === 'rg' && !newCompanions[index].cpf) {
      newCompanions[index].documentNumber = value;
    }
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
      // Garantir que enviamos apenas a quantidade correta de acompanhantes baseada no guestCount
      const trimmedCompanions = formData.companions.slice(0, formData.reservation.guestCount - 1);
      const dataToSave = { ...formData, companions: trimmedCompanions, propertyDetails: selectedProperty };
      
      const success = await saveToGoogleSheets(dataToSave);
      if (success) setStep(FormStep.SUCCESS);
      else alert("Erro ao salvar. Tente novamente.");
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const sendTestData = async () => {
    setLoading(true);
    try {
      const dummyBase64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      const testData: FullFormData = {
        lgpdConsent: true,
        reservation: {
          startDate: '2026-06-25',
          endDate: '2026-07-02',
          guestCount: 2,
          reasonForVisit: 'Férias/Lazer',
          hasVehicle: true,
          vehicleBrand: 'Toyota',
          vehicleModel: 'Corolla',
          vehicleColor: 'Prata',
          vehiclePlate: 'XYZ-1234',
          propertyId: formData.reservation.propertyId || '3',
          totalValue: 1200,
          securityDepositValue: 300,
          hasSecurityDeposit: true,
          bookingSource: formData.reservation.bookingSource || 'alugagoias.com.br'
        },
        mainGuest: {
          fullName: 'HÓSPEDE DE TESTE COMPLETO',
          cpf: '123.456.789-00',
          rg: '1234567-SSP/GO',
          nationality: 'Brasileira',
          email: 'wellington.rodovalho@gmail.com',
          phone: '(62) 99999-9999',
          address: 'Avenida Principal, 100, Setor Bueno, Goiânia - GO, 74210-000',
          addressStreet: 'Avenida Principal, 100',
          addressComplement: 'Apto 101',
          addressDistrict: 'Setor Bueno',
          addressCityState: 'Goiânia - GO',
          addressZipCode: '74210-000',
          maritalStatus: 'Casado(a)',
          profession: 'Engenheiro',
          emergencyContactName: 'Maria de Teste',
          emergencyContactPhone: '(62) 98888-8888',
          emergencyContactRelationship: 'Cônjuge',
          documentFile: dummyBase64Image,
          selfieFile: dummyBase64Image
        },
        pet: {
          hasPet: true,
          name: 'Max',
          breed: 'Golden Retriever',
          species: 'Cão/Gato',
          weight: '30kg',
          age: '3 anos',
          size: 'Grande',
          vaccineFile: dummyBase64Image
        },
        companions: [
          {
            id: 'companion-test-1',
            name: 'ACOMPANHANTE DE TESTE SILVA',
            rg: '7654321',
            cpf: '987.654.321-99',
            email: 'acompanhante.teste@gmail.com',
            phone: '(62) 97777-7777',
            documentNumber: '987.654.321-99',
            documentFile: dummyBase64Image
          }
        ]
      };

      const testProperty = PROPERTIES.find(p => p.id === testData.reservation.propertyId) || PROPERTIES[0];
      const dataToSave = { ...testData, propertyDetails: testProperty };
      
      const success = await saveToGoogleSheets(dataToSave);
      if (success) {
        alert("Teste enviado com sucesso! Verifique a sua planilha do Google e sua caixa de entrada.");
        setStep(FormStep.SUCCESS);
      } else {
        alert("Erro de envio. Certifique-se de que o Apps Script está ativo.");
      }
    } catch (error) {
      alert("Erro ao processar simulação.");
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
        {step > FormStep.CONSENT && step !== FormStep.SUCCESS && <StepIndicator currentStep={step} petAllowed={isPetAllowedProperty} />}

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10">
          
          {step === FormStep.CONSENT && (
            <div className="space-y-6 text-center py-4">
              <h2 className="text-2xl font-black text-slate-800">Bem-vindo ao Check-in</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Precisamos de algumas informações para a sua hospedagem. Se a sua reserva foi feita via <strong>alugagoias.com.br</strong> ou <strong>Booking.com</strong>, geraremos seu contrato de locação temporária. Se foi realizada pelo <strong>Airbnb</strong>, geraremos sua autorização de entrada.
              </p>
              <label className="flex items-center gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer text-left">
                <input type="checkbox" checked={formData.lgpdConsent} onChange={(e) => setFormData(prev => ({ ...prev, lgpdConsent: e.target.checked }))} className="w-6 h-6 rounded text-blue-600" />
                <span className="text-xs font-bold text-blue-900 uppercase">Autorizo o uso dos meus dados para fins contratuais (LGPD).</span>
              </label>
              <button onClick={nextStep} disabled={!formData.lgpdConsent} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-lg disabled:opacity-30">INICIAR CADASTRO</button>

              <div className="pt-6 border-t border-dashed border-slate-200 mt-6 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider mx-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Área de Teste do Corretor
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Use o botão abaixo para enviar dados simulados completos imediatamente à sua planilha e e-mail, verificando como tudo chega sem precisar preencher todo o formulário.
                </p>
                <button 
                  onClick={sendTestData} 
                  disabled={loading}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-black rounded-2xl shadow-md transition-all uppercase text-xs flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      ENVIANDO DADOS DE TESTE...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane text-sm"></i>
                      Simular Envio de Cadastro de Teste
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === FormStep.RESERVATION && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight border-b pb-2">1. Dados da Hospedagem</h2>
              <div className="grid gap-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase mb-1 block tracking-widest">Imóvel da Reserva</label>
                  <p className="text-[9px] text-blue-400 font-bold mb-2 italic">Selecione o imóvel conforme sua reserva</p>
                  <select 
                    name="propertyId" 
                    value={formData.reservation.propertyId} 
                    onChange={handleReservationChange} 
                    className="bg-transparent border-none p-0 focus:ring-0 font-black text-blue-800 text-sm w-full cursor-pointer uppercase"
                  >
                    {PROPERTIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Origem da Reserva</label>
                  <p className="text-[9px] text-blue-600 font-bold ml-1 mb-2 italic">* Onde você realizou a reserva?</p>
                  <div className="flex flex-wrap gap-2">
                    {['Airbnb', 'Booking.com', 'alugagoias.com.br', 'Outros'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, reservation: { ...prev.reservation, bookingSource: opt } }))}
                        className={`px-4 py-2 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${
                          formData.reservation.bookingSource === opt 
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.reservation.bookingSource && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs font-bold text-emerald-800 animate-in fade-in slide-in-from-top-2">
                    {formData.reservation.bookingSource === 'Airbnb' ? (
                      <p>✨ Como sua reserva foi feita pelo <strong>Airbnb</strong>, geraremos apenas a sua <strong>Autorização de Entrada</strong>.</p>
                    ) : (
                      <p>✨ Como sua reserva foi feita pelo/a <strong>{formData.reservation.bookingSource}</strong>, geraremos o seu <strong>Contrato de Locação Temporária</strong>.</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Motivo da Viagem</label>
                  <p className="text-[9px] text-blue-600 font-bold ml-1 mb-2 italic">* Clique no motivo da sua visita</p>
                  <div className="flex flex-wrap gap-2">
                    {['Férias/Lazer', 'Negócios', 'Saúde', 'Parentes/Amigos', 'Eventos', 'Outro'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, reservation: { ...prev.reservation, reasonForVisit: opt } }))}
                        className={`px-4 py-2 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${
                          formData.reservation.reasonForVisit === opt 
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
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

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <label className="text-[10px] font-black text-blue-600 uppercase mb-1 block">Hóspedes</label>
                  <select name="guestCount" value={formData.reservation.guestCount} onChange={handleReservationChange} className="bg-transparent border-none p-0 focus:ring-0 font-black text-blue-800 text-xl w-full">
                    {Array.from({ length: Math.max(8, selectedProperty.capacity) }).map((_, i) => <option key={i+1} value={i+1}>{i+1} Pessoa(s)</option>)}
                  </select>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="hasVehicle" 
                        checked={formData.reservation.hasVehicle} 
                        onChange={handleReservationChange} 
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="text-sm font-bold text-slate-700">Virão de veículo próprio?</span>
                    </label>
                    <p className="text-[10px] text-slate-400 font-bold ml-8 italic uppercase leading-normal">
                      * Opcional: Se não souber os dados do carro agora, pode deixar em branco e enviar o formulário normalmente.
                    </p>
                  </div>

                  {formData.reservation.hasVehicle && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Marca (Opcional)</label>
                        <input name="vehicleBrand" value={formData.reservation.vehicleBrand} onChange={handleReservationChange} placeholder="Ex: Toyota" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Modelo (Opcional)</label>
                        <input name="vehicleModel" value={formData.reservation.vehicleModel} onChange={handleReservationChange} placeholder="Ex: Corolla" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Cor (Opcional)</label>
                        <input name="vehicleColor" value={formData.reservation.vehicleColor} onChange={handleReservationChange} placeholder="Ex: Prata" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Placa (Opcional)</label>
                        <input name="vehiclePlate" value={formData.reservation.vehiclePlate} onChange={handleReservationChange} placeholder="ABC-1234" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={nextStep} disabled={!formData.reservation.startDate || !formData.reservation.endDate || !formData.reservation.bookingSource} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 active:scale-[0.98] transition-all">CONTINUAR</button>
            </div>
          )}

          {step === FormStep.MAIN_GUEST && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-lg font-black text-slate-800 uppercase border-b pb-2">2. Identificação do Titular</h2>
              <div className="grid gap-4">
                <input name="fullName" value={formData.mainGuest.fullName} onChange={handleMainGuestChange} placeholder="NOME COMPLETO" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase placeholder:text-slate-300" />
                
                <div className="grid grid-cols-2 gap-4">
                  <input name="cpf" value={formData.mainGuest.cpf} onChange={handleMainGuestChange} placeholder="CPF" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                  <input name="rg" value={formData.mainGuest.rg} onChange={handleMainGuestChange} placeholder="RG" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest">Estado Civil</label>
                  <select 
                    name="maritalStatus" 
                    value={formData.mainGuest.maritalStatus} 
                    onChange={handleMainGuestChange} 
                    className="bg-transparent border-none p-0 focus:ring-0 font-black text-slate-700 text-sm w-full cursor-pointer"
                  >
                    <option value="">SELECIONE O ESTADO CIVIL</option>
                    {['Solteiro(a)', 'Casado(a)', 'União Estável', 'Divorciado(a)', 'Viúvo(a)'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <input name="profession" value={formData.mainGuest.profession} onChange={handleMainGuestChange} placeholder="PROFISSÃO" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="email" value={formData.mainGuest.email} onChange={handleMainGuestChange} placeholder="E-MAIL" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                  <input name="phone" value={formData.mainGuest.phone} onChange={handleMainGuestChange} placeholder="TELEFONE / WHATSAPP" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fas fa-map-marked-alt text-blue-600"></i> Endereço do Titular
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">CEP</label>
                      <div className="relative flex gap-2">
                        <input 
                          name="addressZipCode" 
                          value={formData.mainGuest.addressZipCode || ''} 
                          onChange={(e) => {
                            handleMainGuestChange(e);
                            if (e.target.value.replace(/\D/g, '').length === 8) {
                              lookupCep(e.target.value);
                            }
                          }} 
                          placeholder="00000-000" 
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm" 
                        />
                        <button 
                          type="button"
                          onClick={() => lookupCep(formData.mainGuest.addressZipCode || '')}
                          disabled={searchingCep}
                          className="px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap uppercase"
                        >
                          {searchingCep ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                          Buscar CEP
                        </button>
                      </div>
                      {cepError && <span className="text-[10px] font-bold text-red-500 ml-1 block">{cepError}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Logradouro (Rua, Avenida, Praça, etc.) e Número</label>
                      <input 
                        name="addressStreet" 
                        value={formData.mainGuest.addressStreet || ''} 
                        onChange={handleMainGuestChange} 
                        placeholder="Rua Exemplo, 123" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm uppercase placeholder:text-slate-300" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Complemento</label>
                      <input 
                        name="addressComplement" 
                        value={formData.mainGuest.addressComplement || ''} 
                        onChange={handleMainGuestChange} 
                        placeholder="Ap 101, Bloco B" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm uppercase placeholder:text-slate-300" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Bairro</label>
                      <input 
                        name="addressDistrict" 
                        value={formData.mainGuest.addressDistrict || ''} 
                        onChange={handleMainGuestChange} 
                        placeholder="Setor Central" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm uppercase placeholder:text-slate-300" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cidade e Estado</label>
                      <input 
                        name="addressCityState" 
                        value={formData.mainGuest.addressCityState || ''} 
                        onChange={handleMainGuestChange} 
                        placeholder="Goiânia - GO" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm uppercase placeholder:text-slate-300" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <FileUpload id="doc_main" label="Doc. Identidade (Frente)" onFileSelect={handleUpload('main')} />
                  <SelfieCapture label="Selfie do Titular" onCapture={(base64) => setFormData(prev => ({ ...prev, mainGuest: { ...prev.mainGuest, selfieFile: base64 } }))} />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="fas fa-phone-alt"></i> Contato de Emergência
                  </h3>
                  <div className="grid gap-3">
                    <input name="emergencyContactName" value={formData.mainGuest.emergencyContactName} onChange={handleMainGuestChange} placeholder="NOME DO CONTATO" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm uppercase" />
                    <div className="grid grid-cols-2 gap-3">
                      <input name="emergencyContactPhone" value={formData.mainGuest.emergencyContactPhone} onChange={handleMainGuestChange} placeholder="CELULAR / WHATSAPP" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm" />
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                      <label className="text-[9px] font-black text-orange-600 uppercase mb-1 block tracking-widest">Parentesco</label>
                      <select 
                        name="emergencyContactRelationship" 
                        value={formData.mainGuest.emergencyContactRelationship} 
                        onChange={handleMainGuestChange} 
                        className="bg-transparent border-none p-0 focus:ring-0 font-black text-orange-800 text-xs w-full cursor-pointer"
                      >
                        <option value="">SELECIONE</option>
                        {['Cônjuge', 'Filho(a)', 'Pai/Mãe', 'Irmão/Irmã', 'Amigo(a)', 'Outro'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl text-slate-600">VOLTAR</button>
                <button 
                  onClick={nextStep} 
                  disabled={!formData.mainGuest.fullName || !formData.mainGuest.cpf || !formData.mainGuest.phone || !formData.mainGuest.documentFile || !formData.mainGuest.selfieFile || !formData.mainGuest.addressStreet || !formData.mainGuest.addressZipCode} 
                  className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-xl disabled:opacity-30 transition-all animate-none"
                >
                  {isPetAllowedProperty ? 'PRÓXIMO: PET' : 'PRÓXIMO: HÓSPEDES'}
                </button>
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
                  type="button"
                  onClick={() => handlePetToggle(false)}
                  className={`py-10 rounded-3xl border-4 transition-all flex flex-col items-center gap-3 ${!formData.pet.hasPet ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${!formData.pet.hasPet ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                    <i className="fas fa-times text-2xl"></i>
                  </div>
                  <span className="font-black text-sm uppercase">NÃO LEVAREI</span>
                </button>

                {isPetAllowedProperty ? (
                  <button 
                    type="button"
                    onClick={() => handlePetToggle(true)}
                    className={`py-10 rounded-3xl border-4 transition-all flex flex-col items-center gap-3 ${formData.pet.hasPet ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-slate-50'}`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${formData.pet.hasPet ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                      <i className="fas fa-dog text-2xl"></i>
                    </div>
                    <span className="font-black text-sm uppercase">SIM, LEVAREI</span>
                  </button>
                ) : (
                  <div 
                    className="py-10 rounded-3xl border-4 border-dashed border-red-200 bg-red-50/20 flex flex-col items-center gap-3 cursor-not-allowed opacity-60 select-none text-center px-4"
                  >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-100 text-red-500">
                      <i className="fas fa-ban text-2xl"></i>
                    </div>
                    <span className="font-black text-xs text-red-600 uppercase">PET NÃO PERMITIDO NESTE IMÓVEL</span>
                  </div>
                )}
              </div>

              {formData.pet.hasPet && (
                <div className="space-y-4 p-6 bg-orange-50/50 border border-orange-100 rounded-3xl animate-in zoom-in-95">
                  <div className="p-4 bg-orange-100/50 rounded-2xl border border-orange-200">
                    <label className="text-[10px] font-black text-orange-600 uppercase mb-1 block tracking-widest">Tipo de Pet</label>
                    <select 
                      name="species" 
                      value={formData.pet.species} 
                      onChange={handlePetChange} 
                      className="bg-transparent border-none p-0 focus:ring-0 font-black text-orange-800 text-sm w-full cursor-pointer uppercase"
                    >
                      {['Cão', 'Gato', 'Aves', 'Outros'].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input name="name" value={formData.pet.name} onChange={handlePetChange} placeholder="NOME DO PET" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold uppercase" />
                    <input name="breed" value={formData.pet.breed} onChange={handlePetChange} placeholder="RAÇA" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold uppercase" />
                  </div>
                  <FileUpload id="pet_vac" label="Carteira de Vacinação do Pet" onFileSelect={handleUpload('pet')} />
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 font-bold rounded-xl text-slate-600">VOLTAR</button>
                <button onClick={nextStep} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-xl">PRÓXIMO: HÓSPEDES</button>
              </div>
            </div>
          )}

          {step === FormStep.COMPANIONS && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-800 uppercase border-b pb-2 flex justify-between items-center">
                  3. Acompanhantes 
                  <span className="text-blue-600 text-xs font-bold">{formData.reservation.guestCount - 1} Pendente(s)</span>
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Você informou {formData.reservation.guestCount} hóspedes no total. Identifique os acompanhantes abaixo:
                </p>
              </div>

              {formData.reservation.guestCount > 1 ? (
                <div className="space-y-6">
                  {Array.from({ length: formData.reservation.guestCount - 1 }).map((_, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-br-xl uppercase">
                        Hóspede {idx + 2}
                      </div>
                      <div className="pt-4 grid gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                          <input 
                            placeholder="NOME COMPLETO DO ACOMPANHANTE" 
                            value={formData.companions[idx]?.name || ''} 
                            onChange={(e) => handleCompanionChange(idx, 'name', e.target.value)} 
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-slate-300" 
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">CPF</label>
                            <input 
                              placeholder="000.000.000-00" 
                              value={formData.companions[idx]?.cpf || ''} 
                              onChange={(e) => handleCompanionChange(idx, 'cpf', e.target.value)} 
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-slate-300" 
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">RG</label>
                            <input 
                              placeholder="NÚMERO DO RG" 
                              value={formData.companions[idx]?.rg || ''} 
                              onChange={(e) => handleCompanionChange(idx, 'rg', e.target.value)} 
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-slate-300" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">E-mail</label>
                            <input 
                              type="email"
                              placeholder="EMAIL DO ACOMPANHANTE" 
                              value={formData.companions[idx]?.email || ''} 
                              onChange={(e) => handleCompanionChange(idx, 'email', e.target.value)} 
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-slate-300" 
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Celular / WhatsApp</label>
                            <input 
                              placeholder="(00) 00000-0000" 
                              value={formData.companions[idx]?.phone || ''} 
                              onChange={(e) => handleCompanionChange(idx, 'phone', e.target.value)} 
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-slate-300" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <i className="fas fa-user text-3xl mb-3 block opacity-20"></i>
                  <p className="font-bold text-xs uppercase">Reserva Individual (Apenas o Titular)</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-slate-100 font-bold rounded-2xl text-slate-600">VOLTAR</button>
                <button 
                  onClick={finalizeProcess} 
                  disabled={loading || (formData.reservation.guestCount > 1 && Array.from({ length: formData.reservation.guestCount - 1 }).some((_, i) => {
                    const companion = formData.companions[i];
                    return !companion?.name || !companion?.rg || !companion?.cpf || !companion?.email || !companion?.phone;
                  }))} 
                  className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30"
                >
                  {loading ? <i className="fas fa-spinner fa-spin text-xl"></i> : <i className="fas fa-check-circle text-xl"></i>}
                  {loading ? 'PROCESSANDO...' : 'FINALIZAR CHECK-IN'}
                </button>
              </div>
              
              {formData.reservation.guestCount > 1 && Array.from({ length: formData.reservation.guestCount - 1 }).some((_, i) => {
                const companion = formData.companions[i];
                return !companion?.name || !companion?.rg || !companion?.cpf || !companion?.email || !companion?.phone;
              }) && (
                <p className="text-[10px] text-red-500 font-black text-center uppercase animate-pulse">
                  * Preencha os dados de todos os acompanhantes para continuar
                </p>
              )}
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

      <footer className="w-full max-w-2xl mx-auto px-4 py-8 mt-auto border-t border-slate-200">
        <div className="text-center space-y-2">
          <p className="text-slate-800 font-black text-sm uppercase">Corretor de Imóveis: WELLINGTON RODOVALHO FONSECA</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>CAEPF: 269.462.701/001-49</span>
            <span>CRECI: CRECI-GO 42695</span>
            <span>CNAI: 54826</span>
          </div>
          <div className="pt-4 flex flex-col items-center gap-2">
            <a href="https://www.alugagoias.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-2">
              <i className="fas fa-globe"></i> www.alugagoias.com.br
            </a>
            <div className="flex gap-6">
              <a href="https://wa.me/5562991514568" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold text-xs hover:underline flex items-center gap-2">
                <i className="fab fa-whatsapp"></i> 62 99151-4568
              </a>
              <a href="mailto:contato@alugagoias.com.br" className="text-slate-600 font-bold text-xs hover:underline flex items-center gap-2">
                <i className="fas fa-envelope"></i> contato@alugagoias.com.br
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
import { ServiceItem, DayType, Appointment, CutSuggestion, ProductItem } from '../types';
import { dataProvider } from '../dataProvider';
import { generateSlug } from '../utils';

interface SchedulingProps {
  settings: any;
}

const Scheduling: React.FC<SchedulingProps> = ({ settings }) => {
  const [step, setStep] = useState(1);
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>([]);
  const [availableCuts, setAvailableCuts] = useState<CutSuggestion[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  
  // Service Options Map (ServiceId -> OptionString)
  const [selectedServiceOptions, setSelectedServiceOptions] = useState<Record<string, string>>({});

  // Single Selection States for Cuts (Radio Logic)
  // Default to 'decide-on-site'
  const [selectedAdultCutId, setSelectedAdultCutId] = useState<string>('decide-on-site');
  const [selectedAdultCutOption, setSelectedAdultCutOption] = useState<string>('');

  const [selectedChildCutId, setSelectedChildCutId] = useState<string>('decide-on-site');
  const [selectedChildCutOption, setSelectedChildCutOption] = useState<string>('');
  
  // Map of productId -> quantity
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

  const [childName, setChildName] = useState('');
  const [errors, setErrors] = useState({ clientName: false, childName: false });

  const [appointment, setAppointment] = useState<Appointment>({
    services: [],
    products: [],
    dayType: null,
    specificDate: null,
    time: null,
    clientName: ''
  });

  useEffect(() => {
    const loadData = async () => {
      const [services, cuts, products] = await Promise.all([
        dataProvider.getServices(),
        dataProvider.getCuts(),
        dataProvider.getProducts()
      ]);

      // Filter Services: Active, has name.
      const filteredServices = services.filter(s => s.active && s.name);

      setAvailableServices(filteredServices);
      setAvailableCuts(cuts.filter(c => c.active && c.name));
      setAvailableProducts(products.filter(p => p.active && p.name));
    };
    loadData();
    
    // Check local storage for pre-selected cut
    const savedCut = localStorage.getItem('selected_cut');
    if (savedCut) {
      try {
        const parsed = JSON.parse(savedCut);
        // Apply to adult selection
        setSelectedAdultCutId(parsed.id);
      } catch (e) { console.error(e); }
    }
  }, []);

  // Helper Logic for Conditions
  // "hasChildCut" is true if AT LEAST ONE selected service has isChild === true
  const hasChildCut = appointment.services.some(s => s.isChild === true);
  
  // "hasAdultCut" is true if AT LEAST ONE selected service has isChild === false (or undefined)
  const hasAdultCut = appointment.services.some(s => !s.isChild);

  const servicesTotal = appointment.services.reduce((acc, curr) => acc + curr.price, 0);
  
  // Calculate Product Total based on Quantity
  const productsTotal = appointment.products.reduce((acc, curr) => {
    const qty = productQuantities[curr.id] || 1;
    return acc + (curr.price * qty);
  }, 0);
  
  const totalValue = servicesTotal + productsTotal;

  // --- Handlers ---

  // Services (Multi-select)
  const toggleService = (service: ServiceItem) => {
    setAppointment(prev => {
      const exists = prev.services.find(s => s.id === service.id);
      let newServices = [];
      if (exists) {
        newServices = prev.services.filter(s => s.id !== service.id);
        // Clean up service options
        const newOptions = {...selectedServiceOptions};
        delete newOptions[service.id];
        setSelectedServiceOptions(newOptions);
      } else {
        newServices = [...prev.services, service];
      }
      return { ...prev, services: newServices };
    });
  };

  const handleServiceOption = (serviceId: string, option: string) => {
    setSelectedServiceOptions(prev => ({ ...prev, [serviceId]: option }));
  };

  // Products (Multi-select with quantity)
  const toggleProduct = (product: ProductItem) => {
    setAppointment(prev => {
      const exists = prev.products.find(p => p.id === product.id);
      let newProducts = [];
      if (exists) {
        // REMOVING PRODUCT
        newProducts = prev.products.filter(p => p.id !== product.id);
        
        // Clean up quantity and options (Product options reuse serviceOptions map for simplicity or could be separate)
        setProductQuantities(prevQ => {
          const newState = { ...prevQ };
          delete newState[product.id];
          return newState;
        });
        
        // If products had options, we would clean them here too. 
        // Using selectedServiceOptions for product options as well since ID space is distinct usually, 
        // or we can use a separate state. For now, assuming products don't strictly use the option selector logic in the prompt's scope.
        const newOptions = {...selectedServiceOptions};
        delete newOptions[product.id];
        setSelectedServiceOptions(newOptions);
        
      } else {
        // ADDING PRODUCT
        newProducts = [...prev.products, product];
        // Default quantity 1
        setProductQuantities(prevQ => ({...prevQ, [product.id]: 1}));
      }
      return { ...prev, products: newProducts };
    });
  };

  const updateProductQuantity = (e: React.MouseEvent, product: ProductItem, delta: number) => {
    e.stopPropagation();
    const current = productQuantities[product.id] || 1;
    const next = current + delta;
    if (next <= 0) {
      toggleProduct(product);
    } else {
      setProductQuantities(prev => ({ ...prev, [product.id]: Math.min(99, next) }));
    }
  };

  // Adult Cut Selection (Single Select - Radio)
  const handleAdultCutSelect = (cutId: string) => {
    setSelectedAdultCutId(cutId);
    setSelectedAdultCutOption(''); // Reset sub-option when changing style
  };

  const handleAdultCutOption = (option: string) => {
    setSelectedAdultCutOption(option);
  };

  // Child Cut Selection (Single Select - Radio)
  const handleChildCutSelect = (cutId: string) => {
    setSelectedChildCutId(cutId);
    setSelectedChildCutOption(''); // Reset sub-option when changing style
  };

  const handleChildCutOption = (option: string) => {
    setSelectedChildCutOption(option);
  };

  const validateFields = () => {
    const newErrors = {
      clientName: !appointment.clientName.trim(),
      childName: hasChildCut && !childName.trim()
    };
    setErrors(newErrors);
    return !newErrors.clientName && !newErrors.childName;
  };

  const confirmOnWhatsApp = () => {
    if (!validateFields()) return;
    
    // Helper to format item with option
    const formatItem = (name: string, id: string, price?: number) => {
       const opt = selectedServiceOptions[id];
       const namePart = opt ? `${name} (${opt})` : name;
       const pricePart = price !== undefined ? ` – R$ ${price},00` : '';
       return `* ${namePart}${pricePart}`;
    };

    const formatProduct = (product: ProductItem) => {
       const qty = productQuantities[product.id] || 1;
       const opt = selectedServiceOptions[product.id];
       const namePart = opt ? `${product.name} (${opt})` : product.name;
       const subtotal = product.price * qty;
       return `* ${namePart} x${qty} – R$ ${subtotal},00`;
    };

    // 1. Build Services List
    const servicesList = appointment.services
      .map(s => formatItem(s.name, s.id, s.price))
      .join('\n');
    
    // Build Products List
    const productsList = appointment.products
      .map(p => formatProduct(p))
      .join('\n');

    // 2. Build Styles Lists (Single Selection Logic)
    const getStyleText = (selectedId: string, selectedOption: string) => {
      if (!selectedId || selectedId === 'decide-on-site') {
        return '- Definir na hora / Escolher no local';
      }
      const cut = availableCuts.find(c => c.id === selectedId);
      if (!cut) return '- Definir na hora / Escolher no local';
      
      return `- ${cut.name}${selectedOption ? ` (${selectedOption})` : ''}`;
    };

    // --- CONSTRUCT MESSAGE WITH DYNAMIC IDENTIFIER ---
    const shopName = settings.name || 'Barbearia';
    const slug = generateSlug(shopName);
    
    // First line: technical identifier
    let msg = `agendamento-${slug}\n`;
    
    // Second line: pretty header
    msg += `✂️ *Agendamento – ${shopName}*\n\n`;
    
    msg += `👤 *Cliente:* ${appointment.clientName}\n`;
    
    if (hasChildCut && childName) {
      msg += `👶 *Cliente Infantil:* ${childName}\n`;
    }
    msg += `\n`;

    if (appointment.services.length > 0) {
      msg += `💈 *Serviços:*\n${servicesList}\n\n`;
    }

    if (appointment.products.length > 0) {
      msg += `🛍️ *Produtos:*\n${productsList}\n\n`;
    }

    // Logic: Show section if Adult service exists
    if (hasAdultCut) {
      msg += `✂️ *Estilo(s) de Corte:*\n`;
      msg += getStyleText(selectedAdultCutId, selectedAdultCutOption);
      msg += `\n\n`;
    }

    // Logic: Show Child Style section only if Child service exists
    if (hasChildCut) {
       msg += `✂️ *Estilo(s) de Corte Infantil:*\n`;
       msg += getStyleText(selectedChildCutId, selectedChildCutOption);
       msg += `\n\n`;
    }

    msg += `💰 *Total:* R$ ${totalValue},00\n\n`;
    msg += `📅 *Data:* ${appointment.specificDate || appointment.dayType}\n`;
    msg += `🕒 *Horário:* ${appointment.time}`;
    
    const phoneClean = settings.phone ? settings.phone.replace(/\D/g, '') : '';
    
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`, '_blank');
    localStorage.removeItem('selected_cut');
  };

  /*
    Flow Logic:
    Step 1: Services + Cuts
    Step 2: Products (if enabled)
    Step 3: Date
    Step 4: Time
    Step 5: Confirm
  */

  const handleNextStep1 = () => {
    if (appointment.services.length === 0) return alert("Selecione um serviço");
    if (settings.productsEnabled) setStep(2);
    else setStep(3);
  };

  // Improved Options Selector (Controlled Component)
  const OptionsSelector = ({ 
    options, 
    selectedValue, 
    onSelect 
  }: { 
    options?: string[], 
    selectedValue: string, 
    onSelect: (val: string) => void 
  }) => {
    if (!options || options.length === 0) return null;
    
    return (
      <div className="mt-3 pl-4 border-l-2 border-[#B8860B] animate-in">
        <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Selecione uma opção:</p>
        <div className="flex flex-wrap gap-2">
          {options.map((opt: string) => (
            <button
              key={opt}
              onClick={(e) => { e.stopPropagation(); onSelect(opt); }}
              className={`px-3 py-1 text-xs border rounded-sm transition-colors ${
                selectedValue === opt 
                  ? 'bg-[#B8860B] text-white border-[#B8860B]' 
                  : 'bg-white text-gray-600 border-gray-300 hover:border-[#B8860B]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render "Decide on Site" Card
  const DecideOnSiteCard = ({ selected, onClick }: { selected: boolean, onClick: () => void }) => (
      <div 
        onClick={onClick}
        className={`p-3 border transition-colors cursor-pointer flex flex-col items-center justify-center text-center min-h-[80px] ${
          selected 
            ? 'bg-[#2C1A1D] border-[#2C1A1D] text-[#B8860B]' 
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400'
        }`}
      >
        <i className="fas fa-comments text-xl mb-1"></i>
        <span className="text-xs font-bold uppercase leading-tight">Definir na hora /<br/>Escolher no local</span>
        {selected && <i className="fas fa-check-circle mt-1 text-sm"></i>}
      </div>
  );

  return (
    <div className="p-6 pb-24 min-h-screen lg:max-w-2xl lg:mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold text-[#2C1A1D] mb-2">Agendamento</h2>
        <div className="h-px w-20 bg-[#B8860B] mx-auto"></div>
      </div>

      <div className="classic-card p-6 md:p-10 bg-white">
        
        {/* Step 1: Services & Style */}
        {step === 1 && (
          <div className="animate-in space-y-8">
            
            {/* Services Selection */}
            <div>
              <div className="flex justify-between items-end mb-3">
                 <label className="block text-xs font-bold uppercase tracking-widest text-[#2C1A1D]">Serviços</label>
                 <span className="text-[#B8860B] font-bold font-serif">Subtotal: R$ {servicesTotal}</span>
              </div>
              
              <div className="space-y-3">
                {availableServices
                  .filter(s => !(hasChildCut && s.notForChildren)) // Filter logic: Hide restricted if child cut is active
                  .map(service => {
                  const isSelected = appointment.services.some(s => s.id === service.id);
                  return (
                    <div 
                      key={service.id}
                      onClick={() => toggleService(service)}
                      className={`w-full p-4 border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#FDFBF7] border-[#2C1A1D]' 
                          : 'bg-white border-[#E5E0D8] hover:border-[#B8860B]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-serif ${isSelected ? 'font-bold' : ''}`}>
                            {service.name}
                            {service.isChild && <span className="ml-2 text-[9px] bg-blue-100 text-blue-800 px-1 rounded uppercase tracking-wide">Infantil</span>}
                            {service.notForChildren && <span className="ml-2 text-[9px] bg-red-100 text-red-800 px-1 rounded uppercase tracking-wide">🚫 Uso Adulto</span>}
                        </span>
                        <div className="flex items-center gap-3">
                           <span className={`text-sm ${isSelected ? 'text-[#B8860B] font-bold' : 'text-gray-500'}`}>R$ {service.price}</span>
                           {isSelected && <i className="fas fa-check-circle text-[#2C1A1D]"></i>}
                        </div>
                      </div>
                      
                      {/* Render Options if Selected - Using Service Options State */}
                      {isSelected && (
                        <OptionsSelector 
                          options={service.options} 
                          selectedValue={selectedServiceOptions[service.id]} 
                          onSelect={(opt) => handleServiceOption(service.id, opt)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Adult Cut Styles (Only if Adult service selected) */}
            {hasAdultCut && (
              <div className="animate-in">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#2C1A1D] mb-3">
                  Estilo de Corte {hasChildCut ? '(Adulto)' : ''}
                  <span className="block text-[9px] text-gray-400 font-normal normal-case mt-1">Selecione apenas um</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  
                  {/* Decide On Site Option */}
                  <DecideOnSiteCard 
                    selected={selectedAdultCutId === 'decide-on-site'} 
                    onClick={() => handleAdultCutSelect('decide-on-site')}
                  />

                  {availableCuts.map(cut => {
                     const isSelected = selectedAdultCutId === cut.id;
                     return (
                        <div 
                          key={`adult-${cut.id}`}
                          onClick={() => handleAdultCutSelect(cut.id)}
                          className={`p-3 border transition-colors cursor-pointer flex flex-col justify-center ${
                            isSelected 
                             ? 'bg-[#FDFBF7] border-[#B8860B]' 
                             : 'bg-white border-[#E5E0D8] hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                             <span className={`text-xs leading-tight ${isSelected ? 'font-bold text-[#B8860B]' : 'text-[#2C1A1D]'}`}>{cut.name}</span>
                             {isSelected && <i className="fas fa-check text-xs text-[#B8860B]"></i>}
                          </div>
                          
                          {/* Independent Adult Option Selector */}
                          {isSelected && (
                             <OptionsSelector 
                               options={cut.options} 
                               selectedValue={selectedAdultCutOption} 
                               onSelect={handleAdultCutOption} 
                             />
                          )}
                        </div>
                     );
                  })}
                </div>
              </div>
            )}

            {/* Child Cut Styles (Only if Child service selected) */}
            {hasChildCut && (
              <div className="animate-in border-t border-[#E5E0D8] pt-6">
                 <label className="block text-xs font-bold uppercase tracking-widest text-[#2C1A1D] mb-3">
                  Estilo de Corte (Infantil)
                  <span className="block text-[9px] text-gray-400 font-normal normal-case mt-1">Selecione apenas um</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  
                  {/* Decide On Site Option */}
                  <DecideOnSiteCard 
                    selected={selectedChildCutId === 'decide-on-site'} 
                    onClick={() => handleChildCutSelect('decide-on-site')}
                  />

                  {availableCuts.map(cut => {
                     const isSelected = selectedChildCutId === cut.id;
                     return (
                        <div 
                          key={`child-${cut.id}`}
                          onClick={() => handleChildCutSelect(cut.id)}
                          className={`p-3 border transition-colors cursor-pointer flex flex-col justify-center ${
                            isSelected 
                             ? 'bg-[#FDFBF7] border-[#B8860B]' 
                             : 'bg-white border-[#E5E0D8] hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                             <span className={`text-xs leading-tight ${isSelected ? 'font-bold text-[#B8860B]' : 'text-[#2C1A1D]'}`}>{cut.name}</span>
                             {isSelected && <i className="fas fa-check text-xs text-[#B8860B]"></i>}
                          </div>
                          
                          {/* Independent Child Option Selector */}
                          {isSelected && (
                             <OptionsSelector 
                               options={cut.options} 
                               selectedValue={selectedChildCutOption} 
                               onSelect={handleChildCutOption} 
                             />
                          )}
                        </div>
                     );
                  })}
                </div>
              </div>
            )}

            <button 
              onClick={handleNextStep1}
              className="w-full classic-btn py-4 text-xs font-bold uppercase tracking-[0.2em]"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 2: Products (Conditional) */}
        {step === 2 && settings.productsEnabled && (
           <div className="animate-in space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-serif font-bold text-[#2C1A1D]">Quer adicionar um produto?</h3>
                <p className="text-sm text-gray-500">Leve a qualidade da barbearia para casa.</p>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {availableProducts
                  .filter(p => !(hasChildCut && p.notForChildren)) // Filter logic: Hide restricted products
                  .map(prod => {
                  const isSelected = appointment.products.some(p => p.id === prod.id);
                  const qty = productQuantities[prod.id] || 1;
                  
                  return (
                    <div
                      key={prod.id}
                      onClick={() => !isSelected && toggleProduct(prod)}
                      className={`p-3 border transition-all ${
                        isSelected 
                         ? 'border-[#B8860B] bg-[#FDFBF7] cursor-default' 
                         : 'border-[#E5E0D8] bg-white hover:border-gray-400 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-gray-100 flex-shrink-0">
                           {prod.imageUrl ? (
                             <img src={prod.imageUrl} className="w-full h-full object-cover" alt="" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-300">
                               <i className="fas fa-box"></i>
                             </div>
                           )}
                         </div>
                         <div className="flex-1">
                           <h4 className="font-bold text-sm text-[#2C1A1D]">
                             {prod.name}
                             {prod.notForChildren && <span className="ml-2 text-[9px] bg-red-100 text-red-800 px-1 rounded uppercase tracking-wide">🚫 Uso Adulto</span>}
                           </h4>
                           <p className="text-xs text-gray-500 line-clamp-1">{prod.description}</p>
                         </div>
                         <div className="flex flex-col items-end">
                           <span className="font-bold text-[#B8860B] text-sm">R$ {prod.price}</span>
                           {isSelected && <i className="fas fa-check-circle text-[#B8860B] mt-1"></i>}
                         </div>
                      </div>

                      {/* Quantity Control & Remove */}
                      {isSelected && (
                         <div className="mt-3 pt-3 border-t border-gray-100 animate-in">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Quantidade</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleProduct(prod); }}
                                    className="text-[10px] uppercase font-bold text-red-500 flex items-center gap-1 hover:text-red-700 transition-colors"
                                >
                                    <i className="fas fa-trash-alt"></i> Remover
                                </button>
                            </div>
                            
                            <div className="flex items-center justify-end gap-3">
                               <button 
                                 onClick={(e) => updateProductQuantity(e, prod, -1)}
                                 className="w-8 h-8 rounded-full border border-[#2C1A1D] text-[#2C1A1D] flex items-center justify-center hover:bg-[#2C1A1D] hover:text-[#B8860B] transition-colors"
                               >
                                 <i className="fas fa-minus text-xs"></i>
                               </button>
                               <span className="font-bold text-lg w-8 text-center">{qty}</span>
                               <button 
                                 onClick={(e) => updateProductQuantity(e, prod, 1)}
                                 className="w-8 h-8 rounded-full border border-[#2C1A1D] text-[#2C1A1D] flex items-center justify-center hover:bg-[#2C1A1D] hover:text-[#B8860B] transition-colors"
                               >
                                 <i className="fas fa-plus text-xs"></i>
                               </button>
                            </div>
                         </div>
                      )}
                      
                      {/* Product options use service map logic for now */}
                      {isSelected && (
                        <OptionsSelector 
                          options={prod.options} 
                          selectedValue={selectedServiceOptions[prod.id]} 
                          onSelect={(opt) => handleServiceOption(prod.id, opt)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="pt-4 border-t border-[#E5E0D8] flex flex-col gap-3">
                <button 
                  onClick={() => setStep(3)}
                  className="w-full classic-btn py-3 text-xs font-bold uppercase tracking-[0.2em]"
                >
                  {appointment.products.length > 0 ? `Continuar (+ R$ ${productsTotal})` : 'Seguir sem produtos'}
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="text-xs uppercase underline text-gray-500 text-center"
                >
                  Voltar
                </button>
              </div>
           </div>
        )}

        {/* Step 3: Date */}
        {step === 3 && (
          <div className="animate-in space-y-6">
            <h3 className="text-xl font-serif text-center mb-6">Quando gostaria de vir?</h3>
            <div className="grid grid-cols-1 gap-4">
              {[DayType.HOJE, DayType.AMANHA, DayType.OUTRO].map(day => (
                <button
                  key={day}
                  onClick={() => {
                     setAppointment(prev => ({...prev, dayType: day}));
                     if (day === DayType.HOJE) setAppointment(p => ({...p, specificDate: new Date().toLocaleDateString()}));
                     if (day !== DayType.OUTRO) setStep(4);
                  }}
                  className="p-5 border border-[#E5E0D8] hover:border-[#B8860B] hover:bg-[#FDFBF7] text-left font-serif text-lg transition-colors"
                >
                  {day}
                </button>
              ))}
            </div>
            
            {appointment.dayType === DayType.OUTRO && (
              <div className="mt-4">
                 <input 
                   type="date" 
                   className="w-full p-4 border border-[#E5E0D8] bg-[#FDFBF7] outline-none"
                   onChange={(e) => {
                      if(e.target.value) {
                         setAppointment(p => ({...p, specificDate: e.target.value.split('-').reverse().join('/')}));
                         setStep(4);
                      }
                   }}
                 />
              </div>
            )}
             <button onClick={() => setStep(settings.productsEnabled ? 2 : 1)} className="text-xs uppercase underline text-gray-500 mt-4 block mx-auto">Voltar</button>
          </div>
        )}

        {/* Step 4: Time */}
        {step === 4 && (
          <div className="animate-in">
             <h3 className="text-xl font-serif text-center mb-6">Escolha o horário</h3>
             <div className="grid grid-cols-3 gap-3 mb-8">
               {['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'].map(time => (
                 <button
                   key={time}
                   onClick={() => {
                     setAppointment(p => ({...p, time}));
                     setStep(5);
                   }}
                   className="py-3 border border-[#E5E0D8] text-sm hover:bg-[#2C1A1D] hover:text-[#B8860B] transition-colors"
                 >
                   {time}
                 </button>
               ))}
             </div>
             <button onClick={() => setStep(3)} className="text-xs uppercase underline text-gray-500 block mx-auto">Voltar</button>
          </div>
        )}

        {/* Step 5: Name & Confirm */}
        {step === 5 && (
          <div className="animate-in text-center space-y-6">
            <h3 className="text-xl font-serif">Para finalizar</h3>
            
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#B8860B] mb-1">Seu Nome (Responsável) *</label>
                <input 
                  type="text" 
                  placeholder="Nome Completo"
                  className={`w-full p-4 border-b-2 bg-[#FDFBF7] text-lg font-serif outline-none ${errors.clientName ? 'border-red-500 bg-red-50' : 'border-[#E5E0D8] focus:border-[#B8860B]'}`}
                  value={appointment.clientName}
                  onChange={e => {
                    setAppointment({...appointment, clientName: e.target.value});
                    setErrors({...errors, clientName: false});
                  }}
                />
                {errors.clientName && <span className="text-red-500 text-xs">Obrigatório</span>}
              </div>

              {hasChildCut && (
                <div className="animate-in">
                   <label className="block text-[10px] font-bold uppercase text-[#B8860B] mb-1">Nome da Criança *</label>
                   <input 
                     type="text" 
                     placeholder="Nome do pequeno"
                     className={`w-full p-4 border-b-2 bg-[#FDFBF7] text-lg font-serif outline-none ${errors.childName ? 'border-red-500 bg-red-50' : 'border-[#E5E0D8] focus:border-[#B8860B]'}`}
                     value={childName}
                     onChange={e => {
                        setChildName(e.target.value);
                        setErrors({...errors, childName: false});
                     }}
                   />
                   {errors.childName && <span className="text-red-500 text-xs">Obrigatório para corte infantil</span>}
                </div>
              )}
            </div>

            <div className="bg-[#FDFBF7] p-6 border border-[#E5E0D8] text-left text-sm space-y-2 mt-4">
               <p><span className="font-bold">Data:</span> {appointment.specificDate || appointment.dayType} às {appointment.time}</p>
               
               <div className="border-t border-[#E5E0D8] my-2 pt-2">
                 <p className="font-bold mb-1">Serviços:</p>
                 <ul className="list-disc pl-4 text-gray-600 text-xs">
                   {appointment.services.map(s => {
                     const opt = selectedServiceOptions[s.id];
                     return <li key={s.id}>{s.name} {opt ? `(${opt})` : ''}</li>;
                   })}
                 </ul>
               </div>

               {appointment.products.length > 0 && (
                 <div className="border-t border-[#E5E0D8] my-2 pt-2">
                   <p className="font-bold mb-1">Produtos:</p>
                   <ul className="list-disc pl-4 text-gray-600 text-xs">
                     {appointment.products.map(p => {
                       const opt = selectedServiceOptions[p.id];
                       const qty = productQuantities[p.id] || 1;
                       return <li key={p.id}>{p.name} x{qty} {opt ? `(${opt})` : ''}</li>;
                     })}
                   </ul>
                 </div>
               )}

               {hasAdultCut && (
                 <div className="border-t border-[#E5E0D8] my-2 pt-2">
                    <p className="font-bold mb-1">Estilo Adulto:</p>
                    <p className="text-xs text-gray-600">
                      {selectedAdultCutId === 'decide-on-site' 
                        ? 'Definir na hora / Escolher no local' 
                        : (() => {
                            const cut = availableCuts.find(c => c.id === selectedAdultCutId);
                            if (!cut) return 'Definir na hora';
                            return `${cut.name}${selectedAdultCutOption ? ` (${selectedAdultCutOption})` : ''}`;
                          })()
                      }
                    </p>
                 </div>
               )}

               {hasChildCut && (
                 <div className="border-t border-[#E5E0D8] my-2 pt-2">
                    <p className="font-bold mb-1">Estilo Infantil:</p>
                    <p className="text-xs text-gray-600">
                      {selectedChildCutId === 'decide-on-site' 
                        ? 'Definir na hora / Escolher no local' 
                        : (() => {
                            const cut = availableCuts.find(c => c.id === selectedChildCutId);
                            if (!cut) return 'Definir na hora';
                            return `${cut.name}${selectedChildCutOption ? ` (${selectedChildCutOption})` : ''}`;
                          })()
                      }
                    </p>
                 </div>
               )}

               <p className="text-lg font-serif font-bold text-[#B8860B] pt-2 mt-2 border-t border-[#E5E0D8]">Total: R$ {totalValue},00</p>
            </div>

            <button 
              onClick={confirmOnWhatsApp}
              className="w-full classic-btn py-4 text-sm font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3"
            >
              <i className="fab fa-whatsapp"></i> Confirmar
            </button>
            <button onClick={() => setStep(4)} className="text-xs uppercase underline text-gray-500">Voltar</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduling;

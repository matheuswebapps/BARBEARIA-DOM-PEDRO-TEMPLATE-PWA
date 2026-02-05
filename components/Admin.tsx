
import React, { useState, useEffect } from 'react';
import { dataProvider } from '../dataProvider';
import { BusinessSettings, ServiceItem, CutSuggestion, ProductItem } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_SERVICES, DEFAULT_CUTS, DEFAULT_PRODUCTS } from '../constants';
import { generateId } from '../utils';
import { getSupabase, isSupabaseConfigured } from '../services/supabaseClient';
import {
  uploadImageToSupabase,
  removeImageFromSupabase,
  tryExtractStoragePathFromPublicUrl,
  type StorageFolder,
} from '../services/storage';

const Admin: React.FC = () => {
  const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').trim();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'business' | 'home' | 'cuts' | 'services' | 'products'>('business');
  
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [cuts, setCuts] = useState<CutSuggestion[]>(DEFAULT_CUTS);
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  
  const [status, setStatus] = useState('');

  // Restore session if Supabase Auth is enabled
  useEffect(() => {
    if (!isSupabaseConfigured || !ADMIN_EMAIL) return;
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsLoggedIn(true);
    });
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    const [s, serv, c, p] = await Promise.all([
      dataProvider.getSettings(),
      dataProvider.getServices(),
      dataProvider.getCuts(),
      dataProvider.getProducts()
    ]);
    setSettings(s);
    setServices(serv);
    setCuts(c);
    setProducts(p);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Supabase Auth (email hidden; user types only the password)
    if (!isSupabaseConfigured || !ADMIN_EMAIL) {
      alert(
        'Admin não configurado.\n\n' +
          'Configure VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e VITE_ADMIN_EMAIL no .env (ou no deploy).'
      );
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password,
      });
      if (error) throw error;
      setIsLoggedIn(true);
      setPassword('');
    } catch {
      alert('Senha incorreta');
    }
  };

  const saveAll = async () => {
    // Prevent double clicks while a save is in progress
    if (status === 'Salvando...' || status === 'Enviando imagem...') return;

    const withTimeout = async <T,>(p: Promise<T>, ms = 20000): Promise<T> => {
      return await Promise.race([
        p,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), ms)
        ),
      ]);
    };

    setStatus('Salvando...');
    
    // Clean up empty options before saving
    const cleanServices = services.map(s => ({ ...s, options: s.options?.filter(o => o.trim() !== '') || [] }));
    const cleanCuts = cuts.map(c => ({ ...c, options: c.options?.filter(o => o.trim() !== '') || [] }));
    const cleanProducts = products.map(p => ({ ...p, options: p.options?.filter(o => o.trim() !== '') || [] }));

    try {
      await withTimeout(
        Promise.all([
          dataProvider.saveSettings(settings),
          dataProvider.saveServices(cleanServices),
          dataProvider.saveCuts(cleanCuts),
          dataProvider.saveProducts(cleanProducts),
        ]) as any,
        20000
      );
    } catch (err: any) {
      console.error('[Admin] Save failed', err);
      setStatus('Erro ao salvar');
      alert(
        'Não foi possível salvar.\n\n' +
          'Checklist rápido:\n' +
          '1) Confirme que as tabelas existem (rode o supabase.sql).\n' +
          '2) Confirme que você está logado no Admin (sessão ativa).\n' +
          '3) Se estiver em produção, confira VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no deploy.\n\n' +
          'Abra o Console (F12) para ver o erro completo.'
      );
      // Keep the UI responsive even if a request hangs/throws
      setTimeout(() => setStatus(''), 2500);
      return;
    }
    
    // Update local state to match cleaned
    setServices(cleanServices);
    setCuts(cleanCuts);
    setProducts(cleanProducts);

    setStatus('Salvo!');
    setTimeout(() => setStatus(''), 2000);
  };

  const handleBrandingUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof BusinessSettings) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Supabase upload (required in sellable template)
    if (isSupabaseConfigured) {
      try {
        setStatus('Enviando imagem...');
        const { publicUrl } = await uploadImageToSupabase('branding', file);

        // Apply immediately in UI
        const next = { ...settings, [field]: publicUrl } as BusinessSettings;
        setSettings(next);

        // Persist immediately so user does NOT need to click "Salvar" just to place the logo/icon.
        // This avoids the "botão de logo" feeling like it does nothing.
        await dataProvider.saveSettings(next);

        setStatus('Salvo!');
        setTimeout(() => setStatus(''), 1500);
      } catch (err: any) {
        console.error(err);
        setStatus('');
        alert('Falha ao enviar imagem. Verifique Storage policies/bucket e se você está logado no Admin.');
      }
      return;
    }

    // Local preview (offline mode)
    const url = URL.createObjectURL(file);
    setSettings(prev => ({ ...prev, [field]: url }));
  };

  const handleRemoveBrandingImage = async (field: keyof BusinessSettings) => {
    const current = (settings as any)[field] as string;
    if (isSupabaseConfigured) {
      const path = tryExtractStoragePathFromPublicUrl(current);
      if (path) {
        try {
          await removeImageFromSupabase(path);
        } catch (e) {
          console.warn('Could not delete image from storage:', e);
        }
      }
    }
    const next = { ...settings, [field]: '' } as BusinessSettings;
    setSettings(next);
    // Persist immediately (same rationale as upload)
    try {
      await dataProvider.saveSettings(next);
    } catch (e) {
      console.warn('Could not persist branding removal:', e);
    }
  };

  const uploadItemImage = async (
    folder: StorageFolder,
    file: File,
    onUrl: (url: string) => void
  ) => {
    if (!isSupabaseConfigured) {
      onUrl(URL.createObjectURL(file));
      return;
    }
    const { publicUrl } = await uploadImageToSupabase(folder, file);
    onUrl(publicUrl);
  };
  
  // Generic handler for updating options in array
  const updateOption = (
    index: number, 
    optionIndex: number, 
    value: string, 
    items: any[], 
    setItems: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    const newItems = [...items];
    if (!newItems[index].options) newItems[index].options = [];
    
    // Ensure array is large enough
    while (newItems[index].options.length <= optionIndex) {
        newItems[index].options.push('');
    }
    
    newItems[index].options[optionIndex] = value;
    setItems(newItems);
  };

  const renderOptionInputs = (index: number, item: any, list: any[], setList: any) => {
    const options: string[] = item.options || [];
    const addOption = () => {
      const n = [...list];
      if (!n[index].options) n[index].options = [];
      n[index].options = [...n[index].options, ''];
      setList(n);
    };
    const removeOption = (optIndex: number) => {
      const n = [...list];
      n[index].options = (n[index].options || []).filter((_: string, i: number) => i !== optIndex);
      setList(n);
    };

    return (
      <div className="mt-2 border-t border-dashed border-[#E5E0D8] pt-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase text-gray-500">Sub-opções (Ex: Tamanho, Cor, Variação)</p>
          <button
            type="button"
            onClick={addOption}
            className="text-[10px] font-bold uppercase text-[#B8860B] hover:underline"
          >
            + Adicionar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                placeholder={`Opção ${i + 1}`}
                className="admin-input text-xs"
                value={opt || ''}
                onChange={e => updateOption(index, i, e.target.value, list, setList)}
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="text-red-500 text-[10px] font-bold uppercase hover:underline"
                title="Remover opção"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2C1A1D] p-6">
        <div className="bg-[#FDFBF7] p-8 max-w-sm w-full shadow-2xl border border-[#B8860B]">
          <h2 className="text-2xl font-serif text-center mb-6 text-[#2C1A1D]">Área Restrita</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="Senha de Acesso"
              className="w-full p-3 border border-[#E5E0D8] mb-4 outline-none focus:border-[#B8860B]"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button className="w-full bg-[#2C1A1D] text-[#B8860B] py-3 font-bold uppercase tracking-widest hover:bg-black transition-colors">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24 bg-[#E5E0D8] text-[#2C1A1D]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-serif font-bold">Painel de Controle</h1>
          <button onClick={saveAll} className="bg-[#2C1A1D] text-[#FDFBF7] px-6 py-2 font-bold rounded shadow hover:bg-[#B8860B] transition-colors">
            {status || 'SALVAR ALTERAÇÕES'}
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
           {['business', 'home', 'cuts', 'services', 'products'].map((t) => (
             <button 
               key={t}
               onClick={() => setActiveTab(t as any)}
               className={`px-6 py-3 font-bold uppercase text-xs tracking-wider transition-colors whitespace-nowrap ${activeTab === t ? 'bg-[#2C1A1D] text-[#B8860B]' : 'bg-[#FDFBF7] text-gray-500'}`}
             >
               {t === 'business' ? 'Configurações' : t === 'home' ? 'Home / Redes' : t === 'cuts' ? 'Cortes / Portfólio' : t === 'products' ? 'Produtos' : 'Serviços'}
             </button>
           ))}
        </div>

        <div className="bg-[#FDFBF7] p-6 shadow-sm border border-white">
          
          {/* BUSINESS SETTINGS */}
          {activeTab === 'business' && (
            <div className="grid md:grid-cols-2 gap-6">
               <div className="col-span-2 bg-yellow-50 p-4 border border-yellow-200 mb-2">
                 <h3 className="text-sm font-bold uppercase mb-2 text-[#B8860B]">Controles Globais</h3>
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input 
                     type="checkbox" 
                     className="w-5 h-5 accent-[#2C1A1D]"
                     checked={settings.childCutEnabled ?? true} 
                     onChange={e => setSettings({...settings, childCutEnabled: e.target.checked})} 
                   />
                   <span className="text-sm font-bold">Ativar lógica de Corte Infantil</span>
                 </label>
                 <p className="text-[10px] text-gray-500 mt-1 ml-7">Habilita campos de criança se um serviço infantil for selecionado.</p>
               </div>

               <div className="col-span-2">
                 <label className="text-xs font-bold uppercase block mb-1">Nome da Barbearia</label>
                 <input className="admin-input" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} />
               </div>
               <div className="col-span-2">
                 <label className="text-xs font-bold uppercase block mb-1">Subtítulo (Home)</label>
                 <input className="admin-input" value={settings.subtitle} onChange={e => setSettings({...settings, subtitle: e.target.value})} />
               </div>
               <div>
                 <label className="text-xs font-bold uppercase block mb-1">Telefone (Agendamento)</label>
                 <input className="admin-input" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} />
               </div>
               
               <div className="col-span-2">
                 <label className="text-xs font-bold uppercase block mb-1">Endereço</label>
                 <input className="admin-input" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
               </div>
               <div>
                 <label className="text-xs font-bold uppercase block mb-1">Link Google Maps (Ação)</label>
                 <input className="admin-input" value={settings.googleMapsUrl} onChange={e => setSettings({...settings, googleMapsUrl: e.target.value})} placeholder="https://goo.gl/maps/..." />
               </div>
               <div>
                 <label className="text-xs font-bold uppercase block mb-1">Texto de Horários</label>
                 <input className="admin-input" value={settings.openingHoursText} onChange={e => setSettings({...settings, openingHoursText: e.target.value})} />
               </div>

               {/* Identidade Visual Section */}
               <div className="col-span-2 mt-6 border-t border-[#E5E0D8] pt-6">
                 <h3 className="text-sm font-bold uppercase mb-4 bg-[#2C1A1D] text-[#B8860B] p-2 inline-block">Identidade Visual</h3>
                 
                 <div className="grid md:grid-cols-2 gap-8">
                   {/* Logo do Site */}
                   <div className="bg-white p-4 border border-[#E5E0D8]">
                     <label className="text-xs font-bold uppercase block mb-3 text-[#2C1A1D]">Logo do Site (Header)</label>
                     <div className="flex items-center gap-4">
                       <div className="w-20 h-20 bg-[#FDFBF7] border border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                         {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                         ) : (
                            <span className="text-[9px] text-gray-400">Sem Logo</span>
                         )}
                       </div>
                       <div className="flex-1">
                         <input 
                           type="file" 
                           accept="image/*"
                           id="upload-logo"
                           className="hidden"
                           onChange={(e) => handleBrandingUpload(e, 'logoUrl')}
                         />
                         <div className="flex gap-2 items-center">
                           <label 
                             htmlFor="upload-logo"
                             className="cursor-pointer bg-[#2C1A1D] text-[#FDFBF7] px-4 py-2 text-[10px] font-bold uppercase tracking-wider inline-block hover:bg-[#B8860B] transition-colors"
                           >
                             Escolher Arquivo
                           </label>
                           {settings.logoUrl && (
                             <button 
                               onClick={() => handleRemoveBrandingImage('logoUrl')}
                               className="text-red-500 text-[10px] font-bold uppercase hover:underline"
                             >
                               Remover
                             </button>
                           )}
                         </div>
                         <p className="text-[10px] text-gray-400 mt-2">Formatos: PNG, JPG, WEBP. Visualização imediata.</p>
                       </div>
                     </div>
                   </div>

                   {/* Ícone do App */}
                   <div className="bg-white p-4 border border-[#E5E0D8]">
                     <label className="text-xs font-bold uppercase block mb-3 text-[#2C1A1D]">Ícone do App (PWA/Mobile)</label>
                     <div className="flex items-center gap-4">
                       <div className="w-20 h-20 bg-[#FDFBF7] border border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative rounded-xl">
                          {settings.appIconUrl ? (
                            <img src={settings.appIconUrl} alt="Icon" className="w-full h-full object-cover" />
                         ) : (
                            <span className="text-[9px] text-gray-400">Sem Ícone</span>
                         )}
                       </div>
                       <div className="flex-1">
                         <input 
                           type="file" 
                           accept="image/*"
                           id="upload-icon"
                           className="hidden"
                           onChange={(e) => handleBrandingUpload(e, 'appIconUrl')}
                         />
                         <div className="flex gap-2 items-center">
                           <label 
                             htmlFor="upload-icon"
                             className="cursor-pointer bg-[#2C1A1D] text-[#FDFBF7] px-4 py-2 text-[10px] font-bold uppercase tracking-wider inline-block hover:bg-[#B8860B] transition-colors"
                           >
                             Escolher Arquivo
                           </label>
                           {settings.appIconUrl && (
                             <button 
                               onClick={() => handleRemoveBrandingImage('appIconUrl')}
                               className="text-red-500 text-[10px] font-bold uppercase hover:underline"
                             >
                               Remover
                             </button>
                           )}
                         </div>
                         <p className="text-[10px] text-gray-400 mt-2">Usado para ícone de adicionar à tela inicial.</p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {/* HOME & CONTACT SETTINGS */}
          {activeTab === 'home' && (
            <div className="space-y-8">
               {/* Contact Links */}
               <div>
                  <h3 className="text-sm font-bold uppercase mb-4 bg-[#E5E0D8] p-2">Redes Sociais & Contato</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">WhatsApp (Link Completo)</label>
                        <input className="admin-input" placeholder="https://wa.me/..." value={settings.whatsappLink || ''} onChange={e => setSettings({...settings, whatsappLink: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">Instagram (Link Completo)</label>
                        <input className="admin-input" placeholder="https://instagram.com/..." value={settings.instagramLink || ''} onChange={e => setSettings({...settings, instagramLink: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">Facebook (Link Completo)</label>
                        <input className="admin-input" placeholder="https://facebook.com/..." value={settings.facebookLink || ''} onChange={e => setSettings({...settings, facebookLink: e.target.value})} />
                    </div>
                  </div>
               </div>

               {/* Hero Section Texts */}
               <div>
                  <h3 className="text-sm font-bold uppercase mb-4 bg-[#E5E0D8] p-2">Conteúdo da Home</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                     <div className="col-span-2">
                       <label className="text-[10px] font-bold uppercase block mb-1">Imagem de Fundo (URL)</label>
                       <input className="admin-input" value={settings.heroImage} onChange={e => setSettings({...settings, heroImage: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold uppercase block mb-1">Botão 1 (Agendar)</label>
                       <input className="admin-input" value={settings.heroButtonTextSchedule} onChange={e => setSettings({...settings, heroButtonTextSchedule: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold uppercase block mb-1">Botão 2 (Cortes)</label>
                       <input className="admin-input" value={settings.heroButtonTextCuts} onChange={e => setSettings({...settings, heroButtonTextCuts: e.target.value})} />
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[1, 2, 3].map(num => (
                      <div key={num} className="border p-4 bg-white">
                        <span className="text-[10px] font-bold text-gray-400 block mb-2">CARD DESTAQUE {num}</span>
                        <input 
                           className="admin-input mb-2 font-bold" 
                           placeholder="Título"
                           value={(settings as any)[`feature${num}Title`] || ''} 
                           onChange={e => setSettings({...settings, [`feature${num}Title`]: e.target.value})} 
                        />
                        <textarea 
                           className="admin-input text-sm h-20" 
                           placeholder="Descrição"
                           value={(settings as any)[`feature${num}Description`] || ''} 
                           onChange={e => setSettings({...settings, [`feature${num}Description`]: e.target.value})} 
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="text-[10px] font-bold uppercase block mb-1">Frase de Rodapé</label>
                    <input className="admin-input" value={settings.footerQuote} onChange={e => setSettings({...settings, footerQuote: e.target.value})} />
                  </div>
               </div>
            </div>
          )}

          {/* CUTS / PORTFOLIO */}
          {activeTab === 'cuts' && (
            <div className="space-y-8">
              <div className="flex items-start justify-between gap-4 bg-[#E5E0D8] p-3">
                <p className="text-sm">Preencha os campos para exibir o corte no site. Você pode adicionar/remover itens sem limite.</p>
                <button
                  type="button"
                  onClick={() => {
                    setCuts(prev => ([
                      ...prev,
                      {
                        id: generateId('cut-'),
                        name: '',
                        technicalName: '',
                        category: 'Geral',
                        imageUrl: '',
                        active: true,
                        options: [],
                      }
                    ]));
                  }}
                  className="bg-[#2C1A1D] text-[#FDFBF7] px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#B8860B] transition-colors whitespace-nowrap"
                >
                  + Adicionar corte
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {cuts.map((cut, idx) => (
                  <div key={cut.id} className="border border-[#E5E0D8] p-4 bg-white">
                     <div className="flex justify-between mb-2">
                        <span className="font-bold text-xs text-gray-400">ITEM #{idx + 1}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCuts(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 text-[10px] font-bold uppercase hover:underline"
                          >
                            Remover
                          </button>
                          <label className="text-xs flex items-center gap-1">
                          <input type="checkbox" checked={cut.active} onChange={e => {
                             const n = [...cuts]; n[idx].active = e.target.checked; setCuts(n);
                          }} /> Ativo
                          </label>
                        </div>
                     </div>
                     <input 
                       className="admin-input mb-2 font-bold" 
                       placeholder="Nome do Corte (Ex: Pompadour)"
                       value={cut.name} 
                       onChange={e => { const n = [...cuts]; n[idx].name = e.target.value; setCuts(n); }} 
                     />
                     <input 
                       className="admin-input mb-2 text-xs" 
                       placeholder="Subtítulo/Técnico"
                       value={cut.technicalName} 
                       onChange={e => { const n = [...cuts]; n[idx].technicalName = e.target.value; setCuts(n); }} 
                     />
                     <div className="flex gap-2 items-center">
                       <input 
                         className="admin-input text-xs flex-1" 
                         placeholder="URL da Imagem (ou envie abaixo)"
                         value={cut.imageUrl} 
                         onChange={e => { const n = [...cuts]; n[idx].imageUrl = e.target.value; setCuts(n); }} 
                       />
                       <input
                         type="file"
                         accept="image/*"
                         className="hidden"
                         id={`cut-upload-${cut.id}`}
                         onChange={async (e) => {
                           const file = e.target.files?.[0];
                           if (!file) return;
                           try {
                             setStatus('Enviando imagem...');
                             await uploadItemImage('cuts', file, (url) => {
                               setCuts(prev => {
                                 const n = [...prev];
                                 n[idx] = { ...n[idx], imageUrl: url };
                                 return n;
                               });
                             });
                             setStatus('');
                           } catch (err) {
                             console.error(err);
                             setStatus('');
                             alert('Falha ao enviar imagem (Storage).');
                           }
                         }}
                       />
                       <label
                         htmlFor={`cut-upload-${cut.id}`}
                         className="cursor-pointer bg-[#2C1A1D] text-[#FDFBF7] px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#B8860B] transition-colors whitespace-nowrap"
                       >
                         Enviar
                       </label>
                     </div>
                     {cut.imageUrl && <img src={cut.imageUrl} className="h-20 w-full object-cover mt-2 opacity-50" />}
                     
                     {renderOptionInputs(idx, cut, cuts, setCuts)}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-8">
               <div className="bg-yellow-50 p-4 border border-yellow-200">
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input 
                     type="checkbox" 
                     className="w-5 h-5 accent-[#2C1A1D]"
                     checked={settings.productsEnabled ?? true} 
                     onChange={e => setSettings({...settings, productsEnabled: e.target.checked})} 
                   />
                   <span className="text-sm font-bold uppercase text-[#2C1A1D]">Mostrar aba Produtos no site</span>
                 </label>
                 <p className="text-[10px] text-gray-500 mt-1 ml-7">Desativado = aba some do menu e do agendamento.</p>
               </div>

              <div className="flex items-start justify-between gap-4 bg-[#E5E0D8] p-3">
                <p className="text-sm">Gerencie os produtos à venda. Você pode adicionar/remover itens sem limite.</p>
                <button
                  type="button"
                  onClick={() => {
                    setProducts(prev => ([
                      ...prev,
                      {
                        id: generateId('prod-'),
                        name: '',
                        description: '',
                        price: 0,
                        imageUrl: '',
                        active: true,
                        options: [],
                        notForChildren: false,
                      }
                    ]));
                  }}
                  className="bg-[#2C1A1D] text-[#FDFBF7] px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#B8860B] transition-colors whitespace-nowrap"
                >
                  + Adicionar produto
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {products.map((prod, idx) => (
                  <div key={prod.id} className="border border-[#E5E0D8] p-4 bg-white">
                     <div className="flex justify-between mb-2">
                        <span className="font-bold text-xs text-gray-400">ITEM #{idx + 1}</span>
                        <div className="flex items-center gap-3">
                           <button
                             type="button"
                             onClick={() => setProducts(prev => prev.filter((_, i) => i !== idx))}
                             className="text-red-500 text-[10px] font-bold uppercase hover:underline"
                           >
                             Remover
                           </button>
                           <label className="text-xs flex items-center gap-1 text-red-600 font-bold">
                             <input type="checkbox" checked={prod.notForChildren ?? false} onChange={e => {
                                const n = [...products]; n[idx].notForChildren = e.target.checked; setProducts(n);
                             }} /> Não é para crianças
                           </label>
                           <label className="text-xs flex items-center gap-1">
                             <input type="checkbox" checked={prod.active} onChange={e => {
                                const n = [...products]; n[idx].active = e.target.checked; setProducts(n);
                             }} /> Ativo
                           </label>
                        </div>
                     </div>
                     <input 
                       className="admin-input mb-2 font-bold" 
                       placeholder="Nome do Produto"
                       value={prod.name} 
                       onChange={e => { const n = [...products]; n[idx].name = e.target.value; setProducts(n); }} 
                     />
                     <input 
                       className="admin-input mb-2 text-xs" 
                       placeholder="Descrição curta"
                       value={prod.description} 
                       onChange={e => { const n = [...products]; n[idx].description = e.target.value; setProducts(n); }} 
                     />
                     <div className="flex gap-2 mb-2 items-center">
                       <input 
                         type="number"
                         className="admin-input w-1/3" 
                         placeholder="R$"
                         value={prod.price} 
                         onChange={e => { const n = [...products]; n[idx].price = Number(e.target.value); setProducts(n); }} 
                       />
                       <div className="flex-1 flex gap-2 items-center">
                         <input 
                           className="admin-input flex-1 text-xs" 
                           placeholder="URL da Imagem (ou envie abaixo)"
                           value={prod.imageUrl} 
                           onChange={e => { const n = [...products]; n[idx].imageUrl = e.target.value; setProducts(n); }} 
                         />
                         <input
                           type="file"
                           accept="image/*"
                           className="hidden"
                           id={`prod-upload-${prod.id}`}
                           onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (!file) return;
                             try {
                               setStatus('Enviando imagem...');
                               await uploadItemImage('products', file, (url) => {
                                 setProducts(prev => {
                                   const n = [...prev];
                                   n[idx] = { ...n[idx], imageUrl: url };
                                   return n;
                                 });
                               });
                               setStatus('');
                             } catch (err) {
                               console.error(err);
                               setStatus('');
                               alert('Falha ao enviar imagem (Storage).');
                             }
                           }}
                         />
                         <label
                           htmlFor={`prod-upload-${prod.id}`}
                           className="cursor-pointer bg-[#2C1A1D] text-[#FDFBF7] px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#B8860B] transition-colors whitespace-nowrap"
                         >
                           Enviar
                         </label>
                       </div>
                     </div>
                     {prod.imageUrl && <img src={prod.imageUrl} className="h-20 w-full object-contain mt-2 border border-gray-100" />}
                     
                     {renderOptionInputs(idx, prod, products, setProducts)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 bg-[#E5E0D8] p-3">
                <p className="text-sm">Gerencie serviços sem limite. Use "É Infantil?" para ativar campos de criança no agendamento.</p>
                <button
                  type="button"
                  onClick={() => {
                    setServices(prev => ([
                      ...prev,
                      {
                        id: generateId('svc-'),
                        name: '',
                        price: 0,
                        durationMinutes: 30,
                        description: '',
                        icon: 'hair',
                        active: true,
                        options: [],
                        isChild: false,
                        notForChildren: false,
                      }
                    ]));
                  }}
                  className="bg-[#2C1A1D] text-[#FDFBF7] px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#B8860B] transition-colors whitespace-nowrap"
                >
                  + Adicionar serviço
                </button>
              </div>
              {services.map((svc, idx) => (
                <div key={svc.id} className="border border-[#E5E0D8] p-4 flex flex-col gap-4 bg-white">
                   <div className="flex flex-col md:flex-row gap-4 md:items-center">
                     <div className="flex-1">
                        <div className="flex justify-between mb-2 md:hidden">
                          <span className="font-bold text-xs text-gray-400">ITEM #{idx + 1}</span>
                        </div>
                        <input 
                          className="admin-input mb-1 font-bold" 
                          placeholder="Nome do Serviço"
                          value={svc.name} 
                          onChange={e => { const n = [...services]; n[idx].name = e.target.value; setServices(n); }} 
                        />
                        <input 
                          className="admin-input text-xs" 
                          placeholder="Descrição curta"
                          value={svc.description} 
                          onChange={e => { const n = [...services]; n[idx].description = e.target.value; setServices(n); }} 
                        />
                     </div>
                     <div className="w-full md:w-24">
                        <label className="text-[10px] font-bold block">Preço</label>
                        <input 
                          type="number"
                          className="admin-input" 
                          value={svc.price} 
                          onChange={e => { const n = [...services]; n[idx].price = Number(e.target.value); setServices(n); }} 
                        />
                     </div>
                     <div className="flex flex-col gap-2 items-start md:items-center">
                        <button
                          type="button"
                          onClick={() => setServices(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 text-[10px] font-bold uppercase hover:underline"
                        >
                          Remover
                        </button>
                        <label className="flex items-center gap-1 text-[10px]">
                            <input type="checkbox" checked={svc.active} onChange={e => {
                                const n = [...services]; n[idx].active = e.target.checked; setServices(n);
                            }} /> Ativo
                        </label>
                        <label className="flex items-center gap-1 text-[10px] text-[#B8860B] font-bold bg-yellow-50 px-2 py-1 border border-[#B8860B] rounded-sm">
                            <input type="checkbox" checked={svc.isChild ?? false} onChange={e => {
                                const n = [...services]; n[idx].isChild = e.target.checked; setServices(n);
                            }} /> É Infantil?
                        </label>
                        <label className="flex items-center gap-1 text-[10px] text-red-600 font-bold">
                            <input type="checkbox" checked={svc.notForChildren ?? false} onChange={e => {
                                const n = [...services]; n[idx].notForChildren = e.target.checked; setServices(n);
                            }} /> Não é para crianças
                        </label>
                     </div>
                   </div>
                   
                   {/* Options for Services */}
                   {renderOptionInputs(idx, svc, services, setServices)}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
      <style>{`
        .admin-input { width: 100%; padding: 8px; border: 1px solid #E5E0D8; outline: none; background: #FDFBF7; }
        .admin-input:focus { border-color: #B8860B; background: #FFF; }
      `}</style>
    </div>
  );
};

export default Admin;

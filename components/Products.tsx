
import React, { useEffect, useState } from 'react';
import { dataProvider } from '../dataProvider';
import { ProductItem, BusinessSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { generateSlug } from '../utils';

const Products: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedProducts, fetchedSettings] = await Promise.all([
        dataProvider.getProducts(),
        dataProvider.getSettings()
      ]);
      // Filter: Must be active AND have a name (handling invisible slots)
      setProducts(fetchedProducts.filter(p => p.active && p.name.trim() !== ''));
      setSettings(fetchedSettings);
    };
    fetchData();
  }, []);

  const handleInterested = (productName: string) => {
    const shopName = settings.name || 'Barbearia';
    const slug = generateSlug(shopName);

    // Using same pattern but specific for products
    const message = encodeURIComponent(`interesse-produto-${slug}\n🛍️ *Loja – ${shopName}*\n\nOlá! Tenho interesse no produto: ${productName}`);
    
    window.open(`https://wa.me/${settings.phone}?text=${message}`, '_blank');
  };

  return (
    <div className="p-4 pb-24 min-h-screen lg:max-w-6xl lg:mx-auto">
      <div className="text-center mb-8">
        <span className="text-[#B8860B] font-bold tracking-widest uppercase text-xs mb-2 block">Loja & Cuidados</span>
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#2C1A1D] mb-4">Nossos Produtos</h2>
        <div className="w-16 h-1 bg-[#2C1A1D] mx-auto"></div>
        <p className="text-gray-600 mt-4 max-w-lg mx-auto font-sans text-sm md:text-base">Leve a experiência da barbearia para sua casa.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {products.length === 0 && <p className="col-span-full text-center text-gray-500 font-serif italic">Carregando produtos...</p>}

        {products.map((product) => (
          <div key={product.id} className="classic-card p-3 flex flex-col group hover:shadow-xl transition-all duration-300 bg-white">
            <div className="aspect-square bg-[#FDFBF7] mb-3 relative overflow-hidden border border-[#E5E0D8]">
               {product.imageUrl ? (
                 <img 
                   src={product.imageUrl} 
                   alt={product.name} 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-[#FDFBF7]">
                    <i className="fas fa-box-open text-2xl md:text-4xl text-[#E5E0D8]"></i>
                 </div>
               )}
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-1 gap-1">
                <h3 className="font-serif text-sm md:text-lg font-bold text-[#2C1A1D] leading-tight">{product.name}</h3>
                {product.price > 0 && (
                   <span className="font-serif text-sm md:text-base font-bold text-[#B8860B] whitespace-nowrap">R$ {product.price}</span>
                )}
              </div>
              
              <p className="text-xs text-gray-600 font-sans mb-3 flex-1 line-clamp-2">{product.description}</p>
              
              <button 
                onClick={() => handleInterested(product.name)}
                className="w-full classic-btn py-2 text-[10px] font-bold uppercase tracking-[0.1em]"
              >
                Tenho Interesse
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;

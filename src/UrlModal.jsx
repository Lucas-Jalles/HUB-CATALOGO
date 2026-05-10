import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function UrlModal({ onClose, onSave, operadoras = [], pastas = [], globalTags = [], preSelectedOp, preSelectedPasta, urlToEdit }) {
  const [formData, setFormData] = useState(urlToEdit || {
    nome: '',
    url: '',
    descricao: '',
    tags: '',
    operadora_id: preSelectedOp || '',
    pasta_id: preSelectedPasta || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // SEGURANÇA: Validação estrita do input no Frontend.
    // Lembrete: O Backend DEVE repetir essa validação antes de salvar no BD.
    const dummyUrl = formData.url.replace(/{.*?}/g, 'teste');
    try {
      const parsed = new URL(dummyUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        alert("Ação bloqueada: Apenas URLs http:// e https:// são permitidas.");
        return;
      }
    } catch (error) {
      alert("Por favor, informe uma URL válida.");
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{urlToEdit ? 'Editar Ação / URL' : 'Nova Ação / URL'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inputNome" className="block text-sm text-gray-400 mb-1">Nome da Ação</label>
            <input id="inputNome" required type="text" 
              className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})} />
          </div>
          <div>
            <label htmlFor="inputUrl" className="block text-sm text-gray-400 mb-1">
              URL Base <span className="text-xs text-gray-500">(Use {'{variavel}'} para dados dinâmicos)</span>
            </label>
            <input id="inputUrl" required type="text" placeholder="https://api.site.com/cache?sku={codigo}" 
              className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 font-mono text-sm transition-colors"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})} />
          </div>
          <div>
            <label htmlFor="inputDesc" className="block text-sm text-gray-400 mb-1">Descrição Breve</label>
            <input id="inputDesc" type="text" 
              className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors"
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Etiquetas (Tags)</label>
            {globalTags.length === 0 ? (
              <p className="text-xs text-gray-500">Nenhuma tag criada. Crie em Configurações.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {globalTags.map(tag => {
                  const currentTags = formData.tags.split(',').map(t=>t.trim()).filter(Boolean);
                  const isSelected = currentTags.includes(tag.nome);
                  return (
                    <button key={tag.id} type="button" onClick={() => {
                      const newTags = isSelected ? currentTags.filter(t => t !== tag.nome) : [...currentTags, tag.nome];
                      setFormData({...formData, tags: newTags.join(', ')});
                    }}
                    style={{ backgroundColor: isSelected ? `${tag.cor}30` : 'transparent', borderColor: isSelected ? tag.cor : '#374151', color: isSelected ? tag.cor : '#9ca3af' }}
                    className="border px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all hover:opacity-80">
                      {tag.nome}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Pasta (Projeto)</label>
              <select required className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors"
                value={formData.operadora_id} onChange={(e) => setFormData({...formData, operadora_id: e.target.value, pasta_id: ''})}>
                <option value="">Selecione...</option>
                {operadoras.map(op => <option key={op.id} value={op.id}>{op.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Pasta Interna</label>
              <select className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg p-2.5 outline-none focus:border-blue-500 transition-colors"
                value={formData.pasta_id} onChange={(e) => setFormData({...formData, pasta_id: e.target.value})}>
                <option value="">Geral (Sem tópico)</option>
                {pastas.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">
              {urlToEdit ? 'Salvar Alterações' : 'Salvar URL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
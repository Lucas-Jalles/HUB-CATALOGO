import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      // Se o valor inicial esperado for uma string, não tenta fazer o parse do JSON.
      // Isso previne que textos que contenham JSON quebrem a aplicação ao virarem objetos.
      if (typeof initialValue === 'string') return saved;

      try {
        return JSON.parse(saved);
      } catch (error) {
        // Se não for um JSON válido, retorna a string pura
        return saved;
      }
    }
    return initialValue;
  });

  useEffect(() => {
    const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, valueToStore);
  }, [key, value]);

  return [value, setValue];
}
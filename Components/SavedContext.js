// Components/SavedContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_KEY = 'jokes:saved';

const SavedContext = createContext();

export const useSaved = () => {
  const context = useContext(SavedContext);
  if (!context) {
    throw new Error('useSaved must be used within a SavedProvider');
  }
  return context;
};

export const SavedProvider = ({ children }) => {
  const [savedJokes, setSavedJokes] = useState([]);
  const [savedStates, setSavedStates] = useState({}); // для быстрого доступа к состоянию сохранения

  // Загрузка сохраненных шуток
  const loadSavedJokes = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_KEY);
      if (saved) {
        const jokes = JSON.parse(saved);
        setSavedJokes(jokes);
        
        // Создаем мапу состояний для быстрого доступа
        const states = {};
        jokes.forEach(joke => {
          const key = `${joke.char}-${joke.index || 0}`;
          states[key] = true;
        });
        setSavedStates(states);
      }
    } catch (error) {
      console.error('Error loading saved jokes:', error);
    }
  }, []);

  // Сохранение шутки
  const saveJoke = useCallback(async (char, index, text) => {
    try {
      const newJoke = {
        id: `${char}-${index}-${Date.now()}`,
        char,
        index,
        text,
        ts: Date.now()
      };
      
      const updatedJokes = [...savedJokes, newJoke];
      setSavedJokes(updatedJokes);
      await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(updatedJokes));
      
      // Обновляем состояние
      const key = `${char}-${index}`;
      setSavedStates(prev => ({ ...prev, [key]: true }));
      
      return true;
    } catch (error) {
      console.error('Error saving joke:', error);
      return false;
    }
  }, [savedJokes]);

  // Удаление шутки
  const removeJoke = useCallback(async (jokeId, char, index) => {
    try {
      const updatedJokes = savedJokes.filter(joke => joke.id !== jokeId);
      setSavedJokes(updatedJokes);
      await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(updatedJokes));
      
      // Обновляем состояние
      const key = `${char}-${index}`;
      setSavedStates(prev => {
        const newStates = { ...prev };
        delete newStates[key];
        return newStates;
      });
      
      return true;
    } catch (error) {
      console.error('Error removing joke:', error);
      return false;
    }
  }, [savedJokes]);

  // Приоритет в очереди (перемещение в начало списка)
  const prioritizeJoke = useCallback(async (jokeId) => {
    try {
      const jokeToMove = savedJokes.find(joke => joke.id === jokeId);
      if (!jokeToMove) return false;

      const otherJokes = savedJokes.filter(joke => joke.id !== jokeId);
      const updatedJokes = [jokeToMove, ...otherJokes];
      
      setSavedJokes(updatedJokes);
      await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(updatedJokes));
      
      return true;
    } catch (error) {
      console.error('Error prioritizing joke:', error);
      return false;
    }
  }, [savedJokes]);

  // Переключение состояния сохранения
  const toggleSave = useCallback(async (char, index, text) => {
    const key = `${char}-${index}`;
    const isSaved = savedStates[key];
    
    if (isSaved) {
      // Находим и удаляем шутку
      const jokeToRemove = savedJokes.find(joke => 
        joke.char === char && joke.index === index
      );
      if (jokeToRemove) {
        await removeJoke(jokeToRemove.id, char, index);
      }
    } else {
      // Сохраняем шутку
      await saveJoke(char, index, text);
    }
    
    return !isSaved;
  }, [savedStates, savedJokes, saveJoke, removeJoke]);

  // Проверка, сохранена ли шутка
  const isJokeSaved = useCallback((char, index) => {
    const key = `${char}-${index}`;
    return savedStates[key] || false;
  }, [savedStates]);

  // Фильтрация по персонажу
  const getJokesByCharacter = useCallback((char) => {
    return char ? savedJokes.filter(joke => joke.char === char) : savedJokes;
  }, [savedJokes]);

  // Загружаем данные при монтировании
  useEffect(() => {
    loadSavedJokes();
  }, [loadSavedJokes]);

  const value = {
    savedJokes,
    savedStates,
    loadSavedJokes,
    saveJoke,
    removeJoke,
    prioritizeJoke,
    toggleSave,
    isJokeSaved,
    getJokesByCharacter,
  };

  return (
    <SavedContext.Provider value={value}>
      {children}
    </SavedContext.Provider>
  );
};

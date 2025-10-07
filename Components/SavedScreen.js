// Components/SavedScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Share,
  Dimensions,
  SafeAreaView,
  ImageBackground,
  Modal,
  Alert,
} from 'react-native';

import CustomTabBar from './CustomTabBar';
import { useSaved } from './SavedContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');


const FONTS = { sigmar: 'Sigmar-Regular' };
const RATINGS_KEY = 'joke_ratings';

const ASSETS = {

  bgBlur:     require('../assets/bg_blure.webp'),
  btnBg:      require('../assets/button.webp'),
  heart:      require('../assets/heart.webp'),
  heartFill:  require('../assets/heart_fill.webp'),
  share:      require('../assets/share.webp'),
  bookmark:   require('../assets/bookmark.webp'),
  bookmarked: require('../assets/bookmark_fill.webp'),

  wolf:       require('../assets/char-wolf.webp'),
  pigA:       require('../assets/char-pig-a.webp'),
  pigB:       require('../assets/char-pig-b.webp'),
  pigC:       require('../assets/char-pig-c.webp'),
};

const CHAR_META = [
  { key: 'wolf', label: 'Kangaroo',     img: ASSETS.wolf },
  { key: 'pigA', label: 'Khrumko',  img: ASSETS.pigA },
  { key: 'pigB', label: 'Rokhasik', img: ASSETS.pigB },
  { key: 'pigC', label: 'Piskoroh', img: ASSETS.pigC },
];

/* -------- палитра, как на макетах -------- */
const C = {
  bgBot:    '#F49C3A',
  card:     '#9BE16A',
  cardEdge: 'rgba(255,255,255,0.95)',
  text:     '#FFFFFF',
  textDark: '#103d12',
  buttonHi: '#82D95A',
  outline:  '#1DAB5C',
};

export default function SavedScreen({ navigation }) {
  const [filter, setFilter] = useState(null);            // null -> all, else char key
  const [showRatingModal, setShowRatingModal] = useState(false); // показывать ли модальное окно рейтинга
  const [rating, setRating] = useState(0); // текущий рейтинг
  const [selectedJoke, setSelectedJoke] = useState(null); // выбранная шутка для рейтинга
  const [jokeRatings, setJokeRatings] = useState({}); // сохраненные рейтинги по ID шуток
  const { savedJokes, removeJoke, loadSavedJokes } = useSaved();

  // Загрузка рейтингов при монтировании компонента
  useEffect(() => {
    loadRatings();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener?.('focus', loadSavedJokes);
    loadSavedJokes();
    return unsub;
  }, [loadSavedJokes, navigation]);

  const loadRatings = async () => {
    try {
      const ratings = await AsyncStorage.getItem(RATINGS_KEY);
      if (ratings) {
        setJokeRatings(JSON.parse(ratings));
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const saveRating = async (jokeId, ratingValue) => {
    try {
      const newRatings = { ...jokeRatings, [jokeId]: ratingValue };
      setJokeRatings(newRatings);
      await AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(newRatings));
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  const filtered = useMemo(() => {
    return filter ? savedJokes.filter((f) => f.char === filter) : savedJokes;
  }, [savedJokes, filter]);

  const shareJoke = async (text) => {
    try {
      await Share.share({ message: text });
    } catch {}
  };

  const openRatingModal = (joke) => {
    setSelectedJoke(joke);
    // Устанавливаем текущий рейтинг, если он уже есть
    setRating(jokeRatings[joke.id] || 0);
    setShowRatingModal(true);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setRating(0);
    setSelectedJoke(null);
  };

  const submitRating = async () => {
    if (rating > 0 && selectedJoke) {
      await saveRating(selectedJoke.id, rating);
      Alert.alert('Thank you!', `You rated this joke ${rating} star${rating > 1 ? 's' : ''}!`);
      closeRatingModal();
    }
  };

  // Функция для проверки, есть ли рейтинг у шутки
  const hasRating = (jokeId) => {
    return jokeRatings[jokeId] && jokeRatings[jokeId] > 0;
  };

  return (
    <ImageBackground source={ASSETS.bgBlur} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
        {/* Chips: фильтр по персонажам */}
        <View style={styles.chipsRow}>
          {CHAR_META.map((c) => {
            const active = filter === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setFilter(active ? null : c.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Image source={c.img} style={styles.chipImg} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Список избранного / пустое состояние */}
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>You have no saved jokes yet.</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <View key={item.id} style={styles.card}>
              {/* аватар */}
              <View style={styles.avatarWrap}>
                <Image source={ASSETS[item.char]} style={styles.avatarImg} />
              </View>

              {/* текст шутки */}
              <Text style={styles.jokeText}>{item.text}</Text>

              {/* действия */}
              <View style={styles.actionsRow}>
                <IconButton
                  source={ASSETS.bookmarked}
                  onPress={() => removeJoke(item.id, item.char, item.index)}
                />
                <IconButton
                  source={ASSETS.share}
                  onPress={() => shareJoke(item.text)}
                />
                <IconButton
                  source={hasRating(item.id) ? ASSETS.heartFill : ASSETS.heart}
                  onPress={() => openRatingModal(item)}
                />
              </View>
            </View>
          ))
        )}
        </ScrollView>
      </SafeAreaView>
      
      {/* нижняя «доска» */}
      <CustomTabBar
        active="saved"
        onHome={() => navigation.navigate('Home')}
        onSaved={() => {}}
        onGame={() => navigation.navigate('GameSetup')}
        onJournal={() => navigation.navigate('Journal')}
      />

      {/* Модальное окно рейтинга */}
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeRatingModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate this joke!</Text>
            <Text style={styles.modalSubtitle}>How many stars would you give?</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Text style={[
                    styles.star,
                    { color: star <= rating ? '#FFD700' : '#CCCCCC' }
                  ]}>
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButton} onPress={closeRatingModal}>
                <ImageBackground source={ASSETS.btnBg} style={styles.modalButtonBg} imageStyle={styles.modalButtonBgImg} resizeMode="stretch">
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </ImageBackground>
              </Pressable>
              
              <Pressable style={styles.modalButton} onPress={submitRating}>
                <ImageBackground source={ASSETS.btnBg} style={styles.modalButtonBg} imageStyle={styles.modalButtonBgImg} resizeMode="stretch">
                  <Text style={styles.modalButtonText}>Submit</Text>
                </ImageBackground>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

/* ---- маленькая кнопка с иконкой ---- */
function IconButton({ source, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.iconBtn}>
      <ImageBackground source={ASSETS.btnBg} style={styles.iconBtnBg} imageStyle={styles.iconBtnBgImg} resizeMode="stretch">
        <Image source={source} style={styles.icon24} />
      </ImageBackground>
    </Pressable>
  );
}

/* --------------- styles --------------- */
const R = 18;

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chip: {
    width: (width - 16 * 2 - 12) / 2,
    height: 80,  // увеличили высоту
    backgroundColor: 'rgba(255,255,255,0.1)',  // прозрачный
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',  // белая рамка
    marginBottom: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    // размытие
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  chipActive: {
    borderColor: '#000080',  // темно-синяя рамка для активного
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chipImg: { width: 50, height: 50, borderRadius: 12, marginRight: 10, resizeMode: 'contain' },  // увеличили и добавили contain
  chipText: { color: '#00BFFF', fontFamily: FONTS.sigmar, fontSize: 18 },  // Deep Sky Blue
  chipTextActive: { color: '#00BFFF' },

  /* пустое состояние */
  emptyWrap: {
    backgroundColor: 'rgba(255,255,255,0.1)',  // прозрачный
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',  // белая рамка
    paddingVertical: 200,  // увеличили чтобы видно только верхнюю и нижнюю рамку
    paddingHorizontal: 12,
    // размытие
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyText: {
    color: '#00BFFF',  // Deep Sky Blue
    fontFamily: FONTS.sigmar,  // шрифт
    fontSize: 22,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 6,
  },

  /* карточка шутки */
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',  // прозрачный
    borderRadius: R,
    padding: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',  // белая рамка
    marginBottom: 12,
    // размытие
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarWrap: {
    alignSelf: 'center',
    width: 140,  // увеличили с 110 до 140
    height: 140, // увеличили с 110 до 140
    borderRadius: 20, // увеличили радиус
    overflow: 'hidden',
    backgroundColor: '#E7C07B',
    marginBottom: 15, // увеличили отступ
    // добавим размытие
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  jokeText: {
    color: '#00BFFF',  // Deep Sky Blue
    fontFamily: FONTS.sigmar,  // шрифт
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 6,
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconBtn: {
    height: 92,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnBgImg: {
    borderRadius: 12,
  },
  icon24: { 
    width: 24, 
    height: 24, 
    resizeMode: 'contain',
    tintColor: '#00BFFF', // Deep Sky Blue для иконок
  },

  /* Модальное окно рейтинга */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 300,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: FONTS.sigmar,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  starButton: {
    padding: 8,
  },
  star: {
    fontSize: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowRadius: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalButton: {
    width: 140,
    height: 70,
  },
  modalButtonBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonBgImg: {
    borderRadius: 12,
  },
  modalButtonText: {
    color: '#333',
    fontSize: 20,
    fontFamily: FONTS.sigmar,
    textAlign: 'center',
  },
});

// Components/GameScreens.js
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  Dimensions,
  SafeAreaView,
  ImageBackground,
  Alert,
  Share,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import CustomTabBar from './CustomTabBar';
import { JOKES } from './jokes';

const { width } = Dimensions.get('window');
const FONTS = { sigmar: 'Sigmar-Regular' };

const ASSETS = {
  bgBlur: require('../assets/bg_blure.webp'),
  btnBg: require('../assets/button.webp'),
  profile: require('../assets/profile.webp'),
  wolf: require('../assets/char-wolf.webp'),
  pigA: require('../assets/char-pig-a.webp'),
  pigB: require('../assets/char-pig-b.webp'),
  pigC: require('../assets/char-pig-c.webp'),
  arrow: require('../assets/arrow.webp'),
  close: require('../assets/close.webp'),
  group: require('../assets/stats.webp'),
  share:require('../assets/share.webp'),
};

// Компонент для ввода имени игрока
const Chip = React.memo(({ player, onPick, showProfile }) => {
  const [localName, setLocalName] = useState(player.name);
  
  useEffect(() => {
    setLocalName(player.name);
  }, [player.name]);
  
  const handleNameChange = useCallback((text) => {
    setLocalName(text);
    onPick((prev) => ({ ...prev, name: text }));
  }, [onPick]);
  
  return (
    <View style={styles.row}>
      <View style={styles.avatarWrapInput}>
        <Image
          source={showProfile ? ASSETS.profile : ASSETS[player.char]}
          style={styles.avatarInput}
          resizeMode="contain"
        />
      </View>
      <TextInput
        style={styles.input}
        value={localName}
        onChangeText={handleNameChange}
        placeholder="Player"
        placeholderTextColor="#cfd9cf"
        autoCorrect={false}
        autoCapitalize="words"
        multiline={false}
      />
    </View>
  );
});

/* ==================== GAME SETUP SCREEN ==================== */
export function GameSetupScreen({ navigation }) {
  const [p1, setP1] = useState({ name: 'Player 1', char: 'wolf' });
  const [p2, setP2] = useState({ name: 'Player 2', char: 'pigA' });

  // шаги: 'names' -> 'pick' -> 'confirm'
  const [step, setStep] = useState('names');
  const [pickerFor, setPickerFor] = useState('p1');
  const [selectedChar, setSelectedChar] = useState(null);
  const [hoveredChar, setHoveredChar] = useState(null);

  const canStart = useMemo(
    () => p1?.name?.trim() && p2?.name?.trim() && p1.char && p2.char,
    [p1, p2]
  );

  const start = useCallback(() => {
    setSelectedChar(null);
    setHoveredChar(null);
    setPickerFor('p1');
    setStep('pick');
  }, []);

  const handleP1Change = useCallback((newP1) => {
    setP1(newP1);
  }, []);

  const handleP2Change = useCallback((newP2) => {
    setP2(newP2);
  }, []);

  const goToConfirmation = () => {
    setSelectedChar(null);
    setHoveredChar(null);
    setStep('confirm');
  };

  const backToNames = () => {
    setSelectedChar(null);
    setHoveredChar(null);
    setPickerFor('p1');
    setStep('names');
  };

  const backToCharacterSelection = () => {
    setSelectedChar(null);
    setHoveredChar(null);
    setPickerFor('p1');
    setStep('pick');
  };

  const continueToGame = () => navigation.navigate('GameCountdown', { p1, p2 });

  const selectChar = (key) => {
    setSelectedChar(key);
    if (pickerFor === 'p1') {
      setP1((v) => ({ ...v, char: key }));
      setPickerFor('p2');
    } else if (pickerFor === 'p2') {
      setP2((v) => ({ ...v, char: key }));
      setPickerFor(null); // остаёмся на экране, ждём стрелку
    }
  };

  const getCharacterBgColor = (character) => {
    const colors = { wolf: '#808080', pigA: '#00FF00', pigB: '#FF0000', pigC: '#FFA500' };
    return colors[character] || '#E7C07B';
  };

  const chooseTitle =
    step === 'pick'
      ? pickerFor
        ? `Choose character for ${pickerFor === 'p1' ? p1.name : p2.name}:`
        : 'Both characters are picked — press the arrow'
      : '';

  return (
    <ImageBackground source={ASSETS.bgBlur} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        {/* Шаг 1: профиль + имена */}
        {step === 'names' && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
            <View style={styles.card}>
              <Text style={styles.h1}>Enter the data:</Text>

              <Chip player={p1} onPick={handleP1Change} showProfile />
              <View style={{ height: 14 }} />
              <Chip player={p2} onPick={handleP2Change} showProfile />

              <Pressable
                style={[styles.setupBigBtn, !canStart && { opacity: 0.6 }]}
                onPress={start}
                disabled={!canStart}
              >
                <ImageBackground
                  source={ASSETS.btnBg}
                  style={styles.setupBigBtnBg}
                  imageStyle={styles.setupBigBtnBgImg}
                  resizeMode="stretch"
                >
                  <Image source={ASSETS.arrow} style={styles.setupBigBtnIcon} resizeMode="contain" />
                </ImageBackground>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {/* Шаг 2: выбор персонажей */}
        {step === 'pick' && (
          <View style={styles.characterSelectionScreen}>
            <View style={styles.characterContainer}>
              <Text style={styles.h2}>{chooseTitle}</Text>

              <View style={styles.grid}>
                {['wolf', 'pigA', 'pigB', 'pigC'].map((k) => {
                  const isSelected = selectedChar === k;
                  const isHovered = hoveredChar === k;
                  const highlightColor = pickerFor === 'p1' ? '#FF0000' : '#FFD700';
                  return (
                    <Pressable
                      key={k}
                      style={[
                        styles.cell,
                        { backgroundColor: getCharacterBgColor(k) },
                        isSelected && [styles.cellSelected, { borderColor: highlightColor, shadowColor: highlightColor }],
                        isHovered && [styles.cellHovered, { borderColor: highlightColor }],
                      ]}
                      onPress={() => selectChar(k)}
                      onPressIn={() => setHoveredChar(k)}
                      onPressOut={() => setHoveredChar(null)}
                    >
                      <Image source={ASSETS[k]} style={styles.cellImg} resizeMode="contain" />
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.controlButtons, { justifyContent: p1.char && p2.char ? 'space-between' : 'center' }]}>
                <Pressable style={styles.backButton} onPress={backToNames}>
                  <ImageBackground source={ASSETS.btnBg} style={styles.backButtonBg} imageStyle={styles.backButtonBgImg} resizeMode="stretch">
                    <Image source={ASSETS.close} style={styles.backButtonIcon} resizeMode="contain" />
                  </ImageBackground>
                </Pressable>

                {p1.char && p2.char && (
                  <Pressable style={styles.continueButton} onPress={goToConfirmation}>
                    <ImageBackground source={ASSETS.btnBg} style={styles.continueButtonBg} imageStyle={styles.continueButtonBgImg} resizeMode="stretch">
                      <Image source={ASSETS.arrow} style={styles.continueButtonIcon} resizeMode="contain" />
                    </ImageBackground>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Шаг 3: подтверждение */}
        {step === 'confirm' && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
            <View style={styles.card}>
              <Text style={styles.h1}>Confirm your choices:</Text>

              <Chip player={p1} onPick={handleP1Change} showProfile={false} />
              <View style={{ height: 14 }} />
              <Chip player={p2} onPick={handleP2Change} showProfile={false} />

              <View style={[styles.controlButtons, { justifyContent: 'space-between', marginTop: 30 }]}>
                <Pressable style={styles.backButton} onPress={backToCharacterSelection}>
                  <ImageBackground source={ASSETS.btnBg} style={styles.backButtonBg} imageStyle={styles.backButtonBgImg} resizeMode="stretch">
                    <Image source={ASSETS.close} style={styles.backButtonIcon} resizeMode="contain" />
                  </ImageBackground>
                </Pressable>

                <Pressable style={styles.continueButton} onPress={continueToGame}>
                  <ImageBackground source={ASSETS.btnBg} style={styles.continueButtonBg} imageStyle={styles.continueButtonBgImg} resizeMode="stretch">
                    <Image source={ASSETS.arrow} style={styles.continueButtonIcon} resizeMode="contain" />
                  </ImageBackground>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      <CustomTabBar
        active="game"
        onHome={() => navigation.replace('Home')}
        onSaved={() => navigation.navigate('Saved')}
        onGame={() => {}}
        onJournal={() => navigation.navigate('Journal')}
      />
    </ImageBackground>
  );
}

/* ---------- Круговой таймер ---------- */
function CircularTimer({ total = 60, remaining = 60 }) {
  // графика
  const strokeWidth = 12;
  const r = 78;
  const size = r * 2 + strokeWidth * 2;
  const C = 2 * Math.PI * r;

  // анимация
  const val = useRef(new Animated.Value(remaining / total)).current;

  useEffect(() => {
    Animated.timing(val, {
      toValue: remaining / total,
      duration: 400,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start();
  }, [remaining, total, val]);

  const dashOffset = val.interpolate({
    inputRange: [0, 1],
    outputRange: [C, 0],
  });

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={[styles.timerWrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* фон окружности */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* прогресс */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#00BFFF"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${C} ${C}`}
          strokeDashoffset={dashOffset}
          // старт сверху
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.timerCenter}>
        <Text style={styles.timerText}>{mm}:{ss}</Text>
      </View>
    </View>
  );
}

/* ==================== GAME COUNTDOWN SCREEN ==================== */
export function GameCountdownScreen({ navigation, route }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    const t = setInterval(() => setN((v) => v - 1), 900);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (n <= 0) navigation.replace('Game', route.params);
  }, [n, navigation, route.params]);

  return (
    <ImageBackground source={ASSETS.bgBlur} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <View style={styles.screen}>
          <Text style={styles.num}>{n}</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

/* ==================== GAME SCREEN ==================== */
export function GameScreen({ navigation, route }) {
  const { p1, p2 } = route.params || {};
  const [turn, setTurn] = useState(0); // 0 -> p1, 1 -> p2
  const [sec, setSec] = useState(60);
  const [idx, setIdx] = useState(0);
  const [isGameActive, setIsGameActive] = useState(true);

  const player = turn === 0 ? p1 : p2;

  // Timer effect - only runs when game is active
  useEffect(() => {
    if (!isGameActive) return;
    
    const t = setInterval(() => setSec((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [isGameActive]);

  // Stop game when screen loses focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setIsGameActive(false);
    });

    const subscribe = navigation.addListener('focus', () => {
      setIsGameActive(true);
      setSec(60); // Reset timer when returning to game
    });

    return () => {
      unsubscribe();
      subscribe();
    };
  }, [navigation]);

  const nextTurn = useCallback(() => {
    setIdx(0);
    setSec(60);
    setTurn((t) => (t === 0 ? 1 : 0));
  }, []);

  useEffect(() => {
    if (sec === 0 && isGameActive) {
      Alert.alert("Time's up!", 'Switch player?', [
        { text: 'Cancel' },
        { text: 'OK', onPress: () => nextTurn() },
      ]);
    }
  }, [sec, nextTurn, isGameActive]);

  const joke = useMemo(() => {
    const list = JOKES[player.char] || ['Funny time!'];
    return list[idx % list.length];
  }, [player.char, idx]);

  const nextJoke = () => setIdx((v) => v + 1);

  const toResults = () => navigation.replace('GameResults', { p1, p2 });

  return (
    <ImageBackground source={ASSETS.bgBlur} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.gameScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.screen}>
            {/* верхняя плашка */}
            <View style={styles.topCard}>
              <Text style={styles.topLabel}>Player's move:</Text>
              <View style={styles.topRow}>
                <Image
                  source={ASSETS[player.char]}
                  style={styles.topAvatar}
                  resizeMode="contain"
                />
                <Text style={styles.topName}>{player.name}</Text>
              </View>
            </View>

            {/* круговой таймер */}
            <View style={styles.timerContainer}>
              <CircularTimer total={60} remaining={sec} />
              {!isGameActive && (
                <View style={styles.pauseOverlay}>
                  <Text style={styles.pauseText}>Game Paused</Text>
                </View>
              )}
            </View>

            {/* карточка шутки */}
            <View style={styles.jokeCard}>
              <View style={styles.avatarWrapJoke}>
                <Image
                  source={ASSETS[player.char]}
                  style={styles.avatarJoke}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.joke}>
                {joke}
              </Text>
              <Pressable style={styles.arrowBtn} onPress={nextJoke}>
                <ImageBackground
                  source={ASSETS.btnBg}
                  style={styles.arrowBtnBg}
                  imageStyle={styles.arrowBtnBgImg}
                  resizeMode="stretch"
                >
                  <Image source={ASSETS.arrow} style={styles.arrowIcon} resizeMode="contain" />
                </ImageBackground>
              </Pressable>
            </View>

            {/* нижние кнопки */}
            <View style={styles.bottomRow}>
              <Pressable style={styles.bottomBtn} onPress={() => navigation.replace('Home')}>
                <ImageBackground source={ASSETS.btnBg} style={styles.bottomBtnBg} imageStyle={styles.bottomBtnBgImg} resizeMode="stretch">
                  <Text style={styles.bottomBtnText}>Home</Text>
                </ImageBackground>
              </Pressable>
              <Pressable style={styles.bottomBtn} onPress={toResults}>
                <ImageBackground source={ASSETS.btnBg} style={styles.bottomBtnBg} imageStyle={styles.bottomBtnBgImg} resizeMode="stretch">
                  <Text style={styles.bottomBtnText}>Win</Text>
                </ImageBackground>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <CustomTabBar
          active="game"
          onHome={() => navigation.replace('Home')}
          onSaved={() => navigation.navigate('Saved')}
          onGame={() => {}}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

/* ==================== GAME RESULTS SCREEN ==================== */
export function GameResultsScreen({ navigation }) {
  const onShare = async () => {
    try {
      await Share.share({
        message: 'The game turned out great! Always stay positive!',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <ImageBackground source={ASSETS.bgBlur} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.resultsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resultsScreen}>
            <Image source={ASSETS.group} style={styles.hero} />
            <View style={styles.card}>
              <Text style={styles.h1}>The game turned out great!</Text>
              <Text style={styles.p}>
                I hope you laughed heartily.{'\n'}Always stay positive!
              </Text>

              <View style={styles.row}>
                <Pressable style={[styles.btn, { flex: 1 }]} onPress={() => navigation.replace('Home')}>
                  <ImageBackground source={ASSETS.btnBg} style={styles.btnBg} imageStyle={styles.btnBgImg} resizeMode="stretch">
                    <Text style={styles.btnText}>Home</Text>
                  </ImageBackground>
                </Pressable>
                <Pressable style={[styles.btn, { flex: 1 }]} onPress={onShare}>
                  <ImageBackground source={ASSETS.btnBg} style={styles.btnBg} imageStyle={styles.btnBgImg} resizeMode="stretch">
                    <Image source={ASSETS.share} style={styles.btnIcon} resizeMode="contain" />
                  </ImageBackground>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        <CustomTabBar
          active="game"
          onHome={() => navigation.replace('Home')}
          onSaved={() => navigation.navigate('Saved')}
          onGame={() => {}}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

/* ==================== STYLES ==================== */
const R = 22;
const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },
  screen: { flex: 1, backgroundColor: 'transparent', padding: 16, paddingBottom: 140 },
  gameScrollContent: { flexGrow: 1, paddingBottom: 140 },
  resultsScrollContent: { flexGrow: 1, paddingBottom: 140 },
  resultsScreen: { flex: 1, backgroundColor: 'transparent', padding: 16, paddingTop: 60 },

  // общая карточка
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: R + 6,
    padding: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  h1: {
    color: '#00BFFF',
    fontFamily: FONTS.sigmar,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 14,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 6,
  },

  // Chip (экран имён)
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  avatarWrapInput: { width: 70, height: 70, borderRadius: 16, backgroundColor: '#000080', alignItems: 'center', justifyContent: 'center' },
  avatarInput: { width: '90%', height: '90%' },
  input: {
    flex: 1, height: 56, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)',
    color: '#00BFFF', paddingHorizontal: 16, fontFamily: FONTS.sigmar, fontSize: 16,
  },

  // Кнопка далее (шаг имён)
  setupBigBtn: { alignSelf: 'center', marginTop: 18, width: 170, height: 110 },
  setupBigBtnBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  setupBigBtnBgImg: { borderRadius: 18 },
  setupBigBtnIcon: { 
    width: 48, 
    height: 48,
    tintColor: '#00BFFF', // Deep Sky Blue для иконки
  },

  // Выбор персонажей
  characterSelectionScreen: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  characterContainer: {
    width: '100%', maxWidth: 420, backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24, padding: 24, borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: 'rgba(0, 0, 0, 0.3)', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8, shadowRadius: 12, elevation: 12,
  },
  h2: {
    color: '#00BFFF', fontFamily: FONTS.sigmar, fontSize: 24, textAlign: 'center',
    marginBottom: 20, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    rowGap: 20, columnGap: 20, marginBottom: 20,
  },
  cell: {
    width: '45%', height: 120, borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#E7C07B', borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: 'rgba(0, 0, 0, 0.2)', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6, shadowRadius: 4, elevation: 4, alignItems: 'center', justifyContent: 'center',
  },
  cellImg: { width: '85%', height: '85%' },
  cellSelected: { borderWidth: 5, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 8 },
  cellHovered: { borderWidth: 3, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 4, elevation: 4 },

  controlButtons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, paddingHorizontal: 20 },
  backButton: { width: 122, height: 122 },
  backButtonBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  backButtonBgImg: { borderRadius: 14 },
  backButtonIcon: { 
    width: 26, 
    height: 26,
    tintColor: '#00BFFF', // Deep Sky Blue для иконки
  },

  continueButton: { width: 122, height: 122 },
  continueButtonBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  continueButtonBgImg: { borderRadius: 14 },
  continueButtonIcon: { 
    width: 26, 
    height: 26,
    tintColor: '#00BFFF', // Deep Sky Blue для иконки
  },

  // Countdown
  num: { 
    fontSize: 160, 
    color: '#000000', 
    fontFamily: FONTS.sigmar, 
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.5)', 
    textShadowRadius: 8 
  },

  // GameScreen (верх)
  topCard: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: R, borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)',
    padding: 10, marginBottom: 12, shadowColor: 'rgba(0, 0, 0, 0.3)', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8, shadowRadius: 8, elevation: 8,
  },
  topLabel: { color: '#00BFFF', fontFamily: FONTS.sigmar, fontSize: 18, textAlign: 'center', marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  topAvatar: { width: 64, height: 64, borderRadius: 14, backgroundColor: '#E7C07B' },
  topName: { color: '#00BFFF', fontFamily: FONTS.sigmar, fontSize: 24, textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 6 },

  // Круговой таймер
  timerWrap: { alignSelf: 'center', marginBottom: 12 },
  timerCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center', left: 0, right: 0, top: 0, bottom: 0 },
  timerText: { color: '#00BFFF', fontFamily: FONTS.sigmar, fontSize: 42, textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 6 },
  timerContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 12,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pauseText: {
    color: '#00BFFF',
    fontFamily: FONTS.sigmar,
    fontSize: 18,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },

  // Карточка шутки
  jokeCard: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: R, borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)',
    padding: 14, marginBottom: 12, shadowColor: 'rgba(0, 0, 0, 0.3)', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8, shadowRadius: 8, elevation: 8,
  },
  avatarWrapJoke: {
    alignSelf: 'center',
    width: 190,
    height: 190,
    borderRadius: 20,
    backgroundColor: '#E7C07B',
    borderWidth: 5,
    borderColor: '#fff',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarJoke: { width: '100%', height: '100%' },

  joke: { color: '#00BFFF', fontFamily: FONTS.sigmar, fontSize: 16, lineHeight: 22, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 6, marginBottom: 10 },
  arrowBtn: { alignSelf: 'center', width: 106, height: 136 , marginBottom:-30, },
  arrowBtnBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  arrowBtnBgImg: { borderRadius: 12 },
  arrowIcon: { 
    width: 34, 
    height: 34,
    tintColor: '#00BFFF', // Deep Sky Blue для иконки
  },

  // Нижние кнопки — больше по высоте и немного шире
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, marginTop: 8 },
  bottomBtn: { width: '48%', height: 144 },
  bottomBtnBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  bottomBtnBgImg: { borderRadius: 18 },
  bottomBtnText: { color: 'white', fontFamily: FONTS.sigmar, fontSize: 30 },

  // Results
  hero: { 
    alignSelf: 'center', 
    width: '120%', 
    height: 380, 
    resizeMode: 'contain', 
    borderRadius: 22, 
    marginBottom: 20,
    marginTop: 20
  },
  p: { color: '#00BFFF', fontFamily: FONTS.sigmar, fontSize: 16, textAlign: 'center', marginBottom: 14, textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 6 },
  btn: { height: 104 },
  btnBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  btnBgImg: { borderRadius: 18 },
  btnText: { color: '#00BFFF', fontFamily: FONTS.sigmar, fontSize: 22 },
  btnIcon: { 
    width: 28, 
    height: 28,
    tintColor: '#00BFFF', // Deep Sky Blue для иконки
  },
});

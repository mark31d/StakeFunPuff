// Components/Onboarding.js
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/* шрифты */
const FONTS = {
  sigmar: 'Sigmar-Regular',
};

/* Палитра */
const PALETTE = {
    textSand: '#00BFFF', // Deep Sky Blue для текста и иконок
  line: 'rgba(255,255,255,0.85)', // белая разделительная линия
};

/* ассеты */
const BG_BLUR  = require('../assets/bg_blure.webp');
const BTN_BG   = require('../assets/button.webp');   // подложка кнопки
const ARROW_IC = require('../assets/arrow.webp');    // стрелка

/* Слайды */
const slides = [
  {
    id: 's1',
    title:
      'Here you will be met by the Wolf and three cheerful pigs — Khrumko, Rokhasik and Piskoroh.',
    subtitle: 'Get ready to laugh until you cry!',
    image: require('../assets/start.webp'),
  },
  {
    id: 's2',
    title:
      'Do you want to hear a joke from the Wolf or from one of the pigs?',
    subtitle: 'Choose a character — and enjoy his best jokes.',
    image: require('../assets/create.webp'),
  },
  {
    id: 's3',
    title: 'Did you like the joke?',
    subtitle:
      'Save it to your collection and choose to view by characters: only the Wolf, only the pigs, or all together!',
    image: require('../assets/start.webp'),
  },
  {
    id: 's4',
    title:
      'Start the game for a minute: jokes from the Wolf and the pigs will help you check who is the real master of humor!',
    subtitle: '',
    image: require('../assets/stats.webp'),
  },
];

export default function Onboarding({ navigation, onComplete }) {
  const scRef = useRef(null);
  const [idx, setIdx] = useState(0);

  const goNext = () => {
    if (idx < slides.length - 1) {
      scRef.current?.scrollTo({ x: (idx + 1) * width, animated: true });
      setIdx((v) => v + 1);
    } else {
      onComplete ? onComplete() : navigation?.replace?.('Home');
    }
  };

  const onScroll = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== idx) setIdx(i);
  };

  return (
    <ImageBackground source={BG_BLUR} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.root}>
        <ScrollView
          ref={scRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {slides.map((s) => (
            <View key={s.id} style={styles.slide}>
              {/* Текстовый блок с линиями сверху и снизу */}
              <View style={styles.textBox}>
                {!!s.title && <Text style={styles.title}>{s.title}</Text>}
                {!!s.subtitle && <Text style={styles.subtitle}>{s.subtitle}</Text>}
              </View>

              {/* Кнопка: подложка button.webp + стрелка */}
              <Pressable
                onPress={goNext}
                style={styles.arrowBtn}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Next"
              >
                <Image source={BTN_BG} style={styles.btnBg} resizeMode="contain" />
                <Image source={ARROW_IC} style={styles.btnArrow} resizeMode="contain" />
              </Pressable>

              {/* Иллюстрация сзади (start/create/stats) */}
              {s.image && (
                <Image source={s.image} style={styles.hero} resizeMode="contain" />
              )}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

/* Sizes */
const BTN_W = 344; // больше капсула
const BTN_H = 222;
const ARROW_W = 56; // чуть меньше стрелка
const ARROW_H = 56;

const styles = StyleSheet.create({
  bg: { flex: 1, width: '100%', height: '100%' },
  root: { flex: 1 },

  slide: {
    width,
    flex: 1,
    paddingTop: 8,
    alignItems: 'center',
  },

  textBox: {
    width: '92%',
    padding: 16,
    marginTop: 8,
    backgroundColor: 'transparent',
    borderTopWidth: 2,              // линия над текстом
    borderBottomWidth: 2,           // линия под текстом
    borderColor: PALETTE.line,
    borderRadius: 18,
  },
  title: {
    color: PALETTE.textSand,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: FONTS.sigmar,
  },
  subtitle: {
    color: PALETTE.textSand,
    marginTop: 12,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: FONTS.sigmar,
  },

  arrowBtn: {
    marginTop: 16,
    alignSelf: 'center',
    width: BTN_W,
    height: BTN_H,
    alignItems: 'center',
    justifyContent: 'center',marginBottom:-69,marginTop:-40,
  },
  btnBg: { position: 'absolute', width: BTN_W, height: BTN_H },
  btnArrow: { 
    width: ARROW_W, 
    height: ARROW_H,
    tintColor: PALETTE.textSand, // Deep Sky Blue для иконки стрелки
  },

  hero: {
    marginTop: 8,
    width: '103%',
    height: 600,
    borderRadius: 20,
  },
});

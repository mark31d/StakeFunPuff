// Components/HomeScreen.js
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  Pressable,
  Share,
  ScrollView,
  Dimensions,
  Alert,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';

import CustomTabBar from './CustomTabBar';
import JOKES from './jokes';
import { useSaved } from './SavedContext';

const { width } = Dimensions.get('window');

const ASSETS = {
  bgBlur: require('../assets/bg_blure.webp'),
  btnBg:  require('../assets/button.webp'),

  arrow:      require('../assets/arrow.webp'),
  bookmark:   require('../assets/bookmark.webp'),
  bookmarked: require('../assets/bookmark_fill.webp'),
  share:      require('../assets/share.webp'),
  close:      require('../assets/close.webp'),

  wolf: require('../assets/char-wolf.webp'),
  pigA: require('../assets/char-pig-a.webp'),
  pigB: require('../assets/char-pig-b.webp'),
  pigC: require('../assets/char-pig-c.webp'),
};

const C = {
  textOn:     '#ffffff',
  textDark:   '#0B2E10',
  buttonHi:   '#82D95A',
  outline:    '#1DAB5C',
  whiteFrame: 'rgba(255,255,255,0.96)',
};

const FONTS = { sigmar: 'Sigmar-Regular' };

const ORDER = ['wolf', 'pigA', 'pigB', 'pigC'];
const JOKE_TITLES = {
  wolf: 'A joke from a kangaroo cub',
  pigA: 'A joke from Hrumko',
  pigB: 'A joke from Rokhasyk',
  pigC: 'A joke from Piskorokh',
};

/* HTML лоадера (вращающиеся звезды) */
const LOADER_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"/>
<style>
html,body{height:100%;margin:0;background:transparent;overflow:hidden}
.wrap{height:100%;display:grid;place-items:center;background:transparent}

/* Вращающиеся звезды по кругу */
.star-loader{--dur:3s;position:relative;width:12em;height:12em;font-size:16px}
.center-circle{position:absolute;top:50%;left:50%;width:3em;height:3em;margin:-1.5em 0 0 -1.5em;border-radius:50%;background:radial-gradient(circle,#FFD700 0%,#FFA500 70%,#FF6B35 100%);animation:centerPulse var(--dur) ease-in-out infinite;box-shadow:0 0 20px rgba(255,215,0,0.6)}

.star-container{position:absolute;top:50%;left:50%;width:10em;height:10em;margin:-5em 0 0 -5em;animation:rotateStars var(--dur) linear infinite}

.star{position:absolute;width:1.2em;height:1.2em;background:#FFD700;clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);animation:starPulse var(--dur) ease-in-out infinite;box-shadow:0 0 15px rgba(255,215,0,0.8)}

.star:nth-child(1){top:0;left:50%;margin-left:-0.6em;animation-delay:0s}
.star:nth-child(2){top:15%;right:15%;animation-delay:0.375s}
.star:nth-child(3){top:50%;right:0;margin-top:-0.6em;animation-delay:0.75s}
.star:nth-child(4){bottom:15%;right:15%;animation-delay:1.125s}
.star:nth-child(5){bottom:0;left:50%;margin-left:-0.6em;animation-delay:1.5s}
.star:nth-child(6){bottom:15%;left:15%;animation-delay:1.875s}
.star:nth-child(7){top:50%;left:0;margin-top:-0.6em;animation-delay:2.25s}
.star:nth-child(8){top:15%;left:15%;animation-delay:2.625s}

.orbit{position:absolute;top:50%;left:50%;width:10em;height:10em;margin:-5em 0 0 -5em;border:2px solid rgba(255,215,0,0.3);border-radius:50%;animation:orbit var(--dur) linear infinite}

@keyframes centerPulse{0%,100%{transform:scale(1);box-shadow:0 0 20px rgba(255,215,0,0.6)}50%{transform:scale(1.2);box-shadow:0 0 30px rgba(255,215,0,0.9)}}
@keyframes starPulse{0%,100%{transform:scale(1);opacity:0.7;filter:brightness(1)}50%{transform:scale(1.3);opacity:1;filter:brightness(1.5)}}
@keyframes rotateStars{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes orbit{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
</style></head>
<body>
  <div class="wrap" role="img" aria-label="Rotating stars loader">
    <div class="star-loader">
      <div class="center-circle"></div>
      <div class="orbit"></div>
      <div class="star-container">
        <div class="star"></div>
        <div class="star"></div>
        <div class="star"></div>
        <div class="star"></div>
        <div class="star"></div>
        <div class="star"></div>
        <div class="star"></div>
        <div class="star"></div>
      </div>
    </div>
  </div>
</body></html>`;

/* ---------- Компонент ---------- */
export default function HomeScreen({ navigation }) {
  const [activeChar, setActiveChar] = useState('wolf');
  const [indexByChar, setIndexByChar] = useState({});
  const [stage, setStage] = useState('pick'); // стадии экрана: 'pick' | 'loading' | 'joke'
  const [showNext, setShowNext] = useState(false); // показывать ли стрелку после выбора

  const { toggleSave, isJokeSaved } = useSaved();
  const scRef = useRef(null);

  const joke = useMemo(() => {
    const idx = indexByChar[activeChar] ?? 0;
    const list = JOKES[activeChar] ?? [];
    return list[idx % Math.max(list.length, 1)] || '';
  }, [activeChar, indexByChar]);

  const isSaved = isJokeSaved(activeChar, indexByChar[activeChar] ?? 0);

  const nextJoke = () => {
    const listLen = (JOKES[activeChar] || []).length || 1;
    setIndexByChar((m) => ({ ...m, [activeChar]: ((m[activeChar] ?? 0) + 1) % listLen }));
    // Остаемся в режиме шутки, показываем новую шутку
    setStage('joke');
  };

  const backToCharacterSelection = () => {
    // Возвращаемся к выбору персонажа
    setStage('pick');
    setShowNext(false);
  };

  const handleToggleSave = async () => {
    await toggleSave(activeChar, indexByChar[activeChar] ?? 0, joke);
  };


  const shareJoke = async () => {
    try {
      await Share.share({ message: joke });
    } catch (e) {
      Alert.alert('Share error', String(e?.message || e));
    }
  };

   /* размеры карточки персонажа */
   const CARD_W = Math.min(0.80 * width, 320);
  const SIDE_PAD = (width - CARD_W) / 2;

  const onCarouselScrollEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / CARD_W);
    const key = ORDER[Math.max(0, Math.min(idx, ORDER.length - 1))];
    if (key && key !== activeChar) {
      setActiveChar(key);
      setShowNext(true);
    }
  };

  const scrollToIndex = (idx) => {
    scRef.current?.scrollTo({ x: idx * CARD_W, animated: true });
  };

  const onPickChar = (k) => {
    const idx = ORDER.indexOf(k);
    if (idx >= 0) scrollToIndex(idx);
    setActiveChar(k);
    setShowNext(true); // подсветили — показали стрелку
  };

  const confirmCharacter = () => {
    // нажали стрелку → показываем лоадер, после паузы — шутку
    setStage('loading');
    setTimeout(() => setStage('joke'), 1200);
  };

  // Цвета фона для каждого персонажа
  const getCharacterBgColor = (character) => {
    const colors = {
      wolf: '#808080',    // серый
      pigA: '#00FF00',    // зеленый
      pigB: '#FF0000',    // красный
      pigC: '#FFA500',    // оранжевый
    };
    return colors[character] || '#E7C07B';
  };

  return (
    <ImageBackground source={ASSETS.bgBlur} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <View style={styles.overlay}>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
          {/* ABOUT */}
          <View style={styles.frame}>
            <View style={styles.capsule}>
              <Text style={styles.h1}>About the app:</Text>
              <Text style={styles.p}>
                Step into a world of laughter with Wolf and the Three Little Pigs! Each character —
                from the clever Wolf to Hrumko, Rokhasyk, and Piskorokh — shares unique jokes to brighten your day.
                Save your favorites, share with friends, or challenge each other in a fun game of humor.
              </Text>
              
              <Pressable style={styles.smallBtn} onPress={shareJoke}>
                <ImageBackground
                  source={ASSETS.btnBg}
                  style={styles.smallBtnBg}
                  imageStyle={styles.smallBtnBgImg}
                  resizeMode="stretch"
                >
                  <Image source={ASSETS.share} style={styles.btnIcon} />
                </ImageBackground>
              </Pressable>
            </View>
          </View>

          {/* СЕКЦИЯ ПОД ВЫБОР / ЛОАДЕР / ШУТКУ */}
          <View style={[styles.frame, { marginTop: 14 }]}>
            <View style={styles.capsule}>
              {stage === 'pick' && (
                <>
                  <Text style={styles.h2}>Choose a character:</Text>

                   <ScrollView
                     ref={scRef}
                     horizontal
                     snapToInterval={CARD_W}
                     decelerationRate="fast"
                     showsHorizontalScrollIndicator={false}
                     contentContainerStyle={{ 
                       paddingHorizontal: SIDE_PAD - 20,  // сдвигаем левее
                       alignItems: 'center'
                     }}
                      style={{ height: 320 }}
                     onMomentumScrollEnd={onCarouselScrollEnd}
                   >
                    {ORDER.map((k) => {
                      const active = activeChar === k;
                      return (
                         <Pressable
                           key={k}
                           onPress={() => onPickChar(k)}
                           style={[styles.cardContainer, { width: CARD_W }]}
                         >
                           <View style={[
                             styles.cardImageWrap, 
                             active && styles.cardImageWrapActive,
                             { backgroundColor: getCharacterBgColor(k) }
                           ]}>
                             <Image
                               source={ASSETS[k]}
                               defaultSource={ASSETS.wolf}
                               style={styles.cardImg}
                               resizeMode="contain"
                             />
                           </View>
                         </Pressable>
                      );
                    })}
                  </ScrollView>

                  {/* Появляющаяся стрелка подтверждения */}
                  {showNext && (
                    <Pressable onPress={confirmCharacter} style={styles.smallBtn}>
                      <ImageBackground
                        source={ASSETS.btnBg}
                        style={styles.smallBtnBg}
                        imageStyle={styles.smallBtnBgImg}
                        resizeMode="stretch"
                      >
                        <Image source={ASSETS.arrow} style={styles.btnIcon} />
                      </ImageBackground>
                    </Pressable>
                  )}
                </>
              )}

              {stage === 'loading' && (
                <View style={styles.loaderCard}>
                  <WebView
                    originWhitelist={['*']}
                    source={{ html: LOADER_HTML }}
                    style={{ width: 210, height: 210, backgroundColor: 'transparent' }}
                    scrollEnabled={false}
                  />
                </View>
              )}

              {stage === 'joke' && (
                <>
                  <Text style={[styles.h2, { marginTop: 0 }]}>{JOKE_TITLES[activeChar]}</Text>

                  <View style={styles.jokeBox}>
                    <View style={styles.jokeAvatar}>
                      <Image
                        source={ASSETS[activeChar]}
                        defaultSource={ASSETS.wolf}
                        style={styles.jokeAvatarImg}
                      />
                    </View>

                    <Text style={styles.jokeText}>{joke}</Text>

                    <View style={styles.actionsRow}>
                      <IconButton
                        source={isSaved ? ASSETS.bookmarked : ASSETS.bookmark}
                        onPress={handleToggleSave}
                      />
                      <IconButton source={ASSETS.share} onPress={async () => {
                        try { await Share.share({ message: joke }); } catch {}
                      }} />
                      <IconButton source={ASSETS.close} onPress={backToCharacterSelection} />
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
      </SafeAreaView>
      
      <CustomTabBar
        active="home"
        onHome={() => navigation.replace('Home')}
        onSaved={() => navigation.navigate('Saved')}
        onGame={() => navigation.navigate('GameSetup')}
        onJournal={() => navigation.navigate('Journal')}
      />
    </ImageBackground>
  );
}

/* ------- мелкий компонент ------- */
function IconButton({ source, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.iconBtn}>
      <ImageBackground
        source={ASSETS.btnBg}
        style={styles.iconBtnBg}
        imageStyle={styles.iconBtnBgImg}
        resizeMode="stretch"
      >
        <Image source={source} style={styles.icon24} />
      </ImageBackground>
    </Pressable>
  );
}

/* ---------- styles ---------- */
const R = 22;

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },
  overlay: { flex: 1 },

  frame: {
    borderWidth: 3,
    borderColor: C.whiteFrame,
    borderRadius: R + 6,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  capsule: {
    width: '100%',
    borderRadius: R,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    // Добавляем размытие
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },

  h1: {
    color: '#00BFFF',  // Deep Sky Blue
    fontFamily: FONTS.sigmar,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 6,
  },
  h2: {
    color: '#00BFFF',  // Deep Sky Blue
    fontFamily: FONTS.sigmar,
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowRadius: 5,
  },
  p: {
    color: '#00BFFF',  // Deep Sky Blue
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },

  /* Кнопки-капсулы */
  smallBtn: {
    alignSelf: 'center',
    width: 118,
    height: 142,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    marginBottom:-30,
  },
  smallBtnBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  smallBtnBgImg: { borderRadius: 14 },
  btnIcon: { 
    width: 38, 
    height: 38, 
    resizeMode: 'contain',
    tintColor: '#00BFFF', // Deep Sky Blue для иконок кнопок
  },

    /* Карточки персонажей */
    cardContainer: {
      alignItems: 'flex-start',  // выравниваем по левому краю
      justifyContent: 'center',
      paddingVertical: 20,
      paddingLeft: 10,           // добавляем отступ слева
      height: 280,            // увеличим высоту контейнера
      marginVertical: 10,     // увеличим отступы
    },
   cardImageWrap: {
     width: '85%',           // уменьшим ширину чтобы не обрезалось
     aspectRatio: 1,         // квадратная форма
     borderRadius: 24,       // увеличим радиус
     borderWidth: 0,         // убираем обводку по умолчанию
     borderColor: 'transparent',
     overflow: 'hidden',
     backgroundColor: '#E7C07B',  // дефолтный цвет
     alignItems: 'center',
     justifyContent: 'center',
     padding: 15,            // увеличим внутренний отступ для центрирования
     // Добавляем размытие
     shadowColor: 'rgba(0, 0, 0, 0.2)',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.6,
     shadowRadius: 4,
     elevation: 4,
   },
   cardImageWrapActive: { 
     borderWidth: 6,         // обводка только для активной карточки
     borderColor: '#000080'  // темно-синяя рамка для активной
   },
   cardImg: { 
     width: '100%', 
     height: '100%',
     resizeMode: 'contain'   // contain для правильного отображения без обрезки
   },

  /* Лоадер */
  loaderCard: {
    alignSelf: 'center',
    width: 240,
    height: 240,
    borderRadius: 24,
    backgroundColor: 'rgba(32,32,38,0.86)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },

  /* Шутка */
  jokeBox: { alignItems: 'stretch' },
   jokeAvatar: {
     alignSelf: 'center',
     width: 190,  // увеличили с 120 до 160
     height: 190, // увеличили с 120 до 160
     borderRadius: 20, // увеличили радиус
     overflow: 'hidden',
     marginBottom: 15, // увеличили отступ
     backgroundColor: '#E7C07B',
     borderWidth: 5, // увеличили толщину рамки
     borderColor: '#fff',
   },
  jokeAvatarImg: { width: '100%', height: '100%' ,  padding:12,resizeMode:'contain',},
  jokeText: {
    color: '#fff',
    fontFamily: FONTS.sigmar,
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
  iconBtnBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  iconBtnBgImg: { borderRadius: 12 },
  icon24: { 
    width: 24, 
    height: 24, 
    resizeMode: 'contain',
    tintColor: '#00BFFF', // Deep Sky Blue для иконок действий
  },
});

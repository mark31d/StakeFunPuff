// Components/Loader.js
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Image, ImageBackground, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const BG   = require('../assets/bg.webp');
const LOGO = require('../assets/Logo.webp');

/* размеры */
const LOGO_SIZE = 350;                                       // большой логотип сверху (квадрат)
const SIDE = Math.min(240, Math.round(width * 0.62));        // квадрат под анимацию снизу

/* Полный HTML + CSS (пульсирующие звезды) */
const HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
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

export default function Loader({ delay = 1500, fadeMs = 250, onFinish = () => {} }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: fadeMs, useNativeDriver: true })
        .start(({ finished }) => finished && onFinish());
    }, delay);
    return () => clearTimeout(t);
  }, [delay, fadeMs, onFinish, opacity]);

  return (
    <Animated.View style={[styles.root, { opacity }]}>
      <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
        <SafeAreaView style={styles.container} edges={['top','left','right','bottom']}>
          {/* ЛОГО СВЕРХУ (350×350) */}
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />

          {/* АНИМАЦИЯ ВНИЗУ */}
          <View style={styles.loaderCard}>
            <WebView
              originWhitelist={['*']}
              source={{ html: HTML }}
              style={styles.web}
              automaticallyAdjustContentInsets={false}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              containerStyle={{ backgroundColor: 'transparent' }}
            />
          </View>
        </SafeAreaView>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1, width: '100%', height: '100%' },

  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',   // логотип сверху, анимация снизу
    paddingTop: 12,
    paddingBottom: 18,
  },

  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 22,
  },

  /* строгий квадрат (карточка для WebView) */
  loaderCard: {
    width: SIDE + 24,
    height: SIDE + 24,
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(32,32,38,0.86)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  web: {
    width: SIDE,
    height: SIDE,
    backgroundColor: 'transparent',
  },
});

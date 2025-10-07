import React from 'react';
import { StyleSheet, Image, ImageBackground, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ASSETS = {
  bg:   require('../assets/long_button.webp'), // зелёная капсула-подложка
  home: require('../assets/tab-home.webp'),
  saved:require('../assets/tab-bookmark.webp'),
  game: require('../assets/tab-gamepad.webp'),
  journal: require('../assets/star.webp'),
};

export default function CustomTabBar({
  active = 'home',   // 'home' | 'saved' | 'game' | 'journal'
  onHome,
  onSaved,
  onGame,
  onJournal,
  style,
}) {
  const insets = useSafeAreaInsets();
  const isActive = (k) => active === k;

  return (
    <View
      pointerEvents="box-none"
      style={styles.floater}
    >
      <ImageBackground
        source={ASSETS.bg}
        resizeMode="stretch"
        style={[styles.wrap, style]}
        imageStyle={styles.bgImg}
      >
        <TabIcon icon={ASSETS.home}    active={isActive('home')}    onPress={onHome} isHome={true} />
        <TabIcon icon={ASSETS.saved}   active={isActive('saved')}   onPress={onSaved} />
        <TabIcon icon={ASSETS.game}    active={isActive('game')}    onPress={onGame} />
        <TabIcon icon={ASSETS.journal} active={isActive('journal')} onPress={onJournal} />
      </ImageBackground>
    </View>
  );
}

function TabIcon({ icon, active, onPress, isHome = false }) {
  // Иконка дома Deep Sky Blue когда НЕ активна, остальные белые при активности
  const getTintColor = () => {
    if (isHome) {
      return active ? '#FFFFFF' : '#00BFFF'; // иконка дома: белая если активна, Deep Sky Blue если неактивна
    }
    return active ? '#FFFFFF' : '#00BFFF'; // Deep Sky Blue цвет для неактивных иконок
  };

  return (
    <Pressable onPress={onPress} style={styles.item} hitSlop={12}>
      <Image
        source={icon}
        resizeMode="contain"
        style={[styles.icon, { tintColor: getTintColor() }]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({

  floater: {
    position: 'absolute',
    left: 0, right: 0, bottom: -50,   // опускаем ниже
    alignItems: 'center',
    paddingBottom: 20,  // отступ снизу для безопасной зоны
  },
  
  wrap: {
    height: 220,                      // выше по высоте
    width: 450,                       // увеличили ширину для 4 иконок
    alignSelf: 'center',              // центрирование по горизонтали
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',  // чтобы иконки не прижимались к краям
    paddingHorizontal: 40,            // уменьшили отступ для 4 иконок
    borderRadius: 24,                 // и сам контейнер, и картинка — с радиусом
    overflow: 'hidden',               // клип по радиусу, ничего не «выпрыгнет»
  },
  bgImg: {
    borderRadius: 24,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,                           // равномерное распределение пространства
    minHeight: 64,
  },
  icon: {
    width: 40,                         // немного больше для лучшей видимости
    height: 40,
  },
});


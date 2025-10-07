// Components/JournalScreen.js - Catch the Apples Game
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Image, ImageBackground, Pressable, StyleSheet, Platform, Dimensions, ScrollView,
  SafeAreaView, Alert,
} from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import CustomTabBar from './CustomTabBar';

const { width: SCREEN_W } = Dimensions.get('window');

/* ─ UI Colors (адаптированы под стиль приложения) ─ */
const COLORS = {
  primary:   '#00BFFF',
  secondary: '#87CEEB', 
  accent:    '#000080',
  text:      '#00BFFF',
  title:     '#00BFFF',
  card:      'rgba(255,255,255,0.1)',
  card2:     'rgba(255,255,255,0.05)',
  line:      'rgba(255,255,255,0.8)',
  dim:       'rgba(255,255,255,0.9)',
  shadow:    '#000000',
};

const FONTS = { sigmar: 'Sigmar-Regular' };

/* ─ storage ─ */
const STARS_KEY     = 'jsp:stars';
const LAST_TS_KEY   = 'jsp:catchApples:lastTs';
const COOLDOWN_MS   = 10 * 60 * 1000; // 10 минут

/* ─ assets ─ */
const ASSETS = {
  bgBlur: require('../assets/bg_blure.webp'),
  btnBg: require('../assets/button.webp'),
  arrow: require('../assets/arrow.webp'),
  close: require('../assets/close.webp'),
  share: require('../assets/share.webp'),
  // Звезды для ловли
  star: require('../assets/star.webp'),
  // Персонажи для выбора игрока
  wolf: require('../assets/char-wolf.webp'),
  pigA: require('../assets/char-pig-a.webp'),
  pigB: require('../assets/char-pig-b.webp'),
  pigC: require('../assets/char-pig-c.webp'),
};

/* ─ gameplay ─ */
const AREA_H         = 380;
const GAME_MS        = 20000;
const SPAWN_MS       = 550;
const APPLE_MIN      = 28;
const APPLE_MAX      = 56;
const APPLE_V_MIN    = 160;
const APPLE_V_MAX    = 300;
const PLAYER_W       = 96;
const PLAYER_H       = 96;
const EDGE_PAD       = 8;

/* ─ helpers ─ */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand  = (a, b) => a + Math.random() * (b - a);
const mmss = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/* ─ Renderers ─ */
const PlayerRenderer = ({ body, size = [PLAYER_W, PLAYER_H], playerChar }) => {
  if (!body) return null;
  const x = body.position.x - size[0] / 2;
  const y = body.position.y - size[1] / 2;
  return (
    <Image
      source={ASSETS[playerChar] || ASSETS.wolf}
      style={{ position:'absolute', left:x, top:y, width:size[0], height:size[1], resizeMode:'contain' }}
    />
  );
};

const StarRenderer = ({ body, size = [40, 40] }) => {
  if (!body) return null;
  const x = body.position.x - size[0] / 2;
  const y = body.position.y - size[1] / 2;
  return (
    <Image
      source={ASSETS.star}
      style={{ position:'absolute', left:x, top:y, width:size[0], height:size[1], resizeMode:'contain' }}
    />
  );
};

/* ─ Systems ─ */
const Physics = (entities, { time }) => {
  Matter.Engine.update(entities.physics.engine, time.delta);
  return entities;
};

const TouchControl = (entities, { touches }) => {
  const { bounds } = entities;
  const player = entities.player;
  if (!player?.body) return entities;

  const moveTouches = touches.filter(t => t.type === 'move' || t.type === 'start');
  if (moveTouches.length) {
    const t = moveTouches[moveTouches.length - 1];
    const pageX = t.event?.pageX ?? (bounds.pageX + t.event?.locationX ?? bounds.w / 2);
    const localX = clamp(pageX - bounds.pageX, 0, bounds.w);
    const x = clamp(bounds.x + localX, bounds.x + PLAYER_W / 2, bounds.x + bounds.w - PLAYER_W / 2);
    Matter.Body.setPosition(player.body, { x, y: player.body.position.y });
  }
  return entities;
};

const SpawnStars = (entities, { time }) => {
  const { world } = entities.physics;
  const { lastSpawnAt, nextSpawnIn } = entities.spawner;
  if (lastSpawnAt == null) {
    entities.spawner.lastSpawnAt = time.current;
    entities.spawner.nextSpawnIn = 200;
    return entities;
  }
  if (time.current - lastSpawnAt >= nextSpawnIn) {
    const id = `star_${Math.random().toString(36).slice(2)}`;
    const size = Math.round(rand(APPLE_MIN, APPLE_MAX));
    const x = entities.bounds.x + rand(size/2, entities.bounds.w - size/2);
    const y = entities.bounds.y - size;
    const body = Matter.Bodies.circle(x, y, size/2, { isSensor: true, label: 'Star' });
    Matter.World.add(world, body);
    
    entities[id] = {
      body,
      size: [size, size],
      vy: rand(APPLE_V_MIN, APPLE_V_MAX),
      renderer: StarRenderer,
    };
    entities.spawner.lastSpawnAt = time.current;
    entities.spawner.nextSpawnIn = SPAWN_MS;
  }
  return entities;
};

const MoveStars = (entities, { time }) => {
  const { bounds } = entities;
  Object.keys(entities).forEach(key => {
    if (!key.startsWith('star_')) return;
    const a = entities[key];
    const b = a.body;
    if (!b) return;
    const dy = (a.vy || 0) * (time.delta / 1000);
    Matter.Body.setPosition(b, { x: b.position.x, y: b.position.y + dy });
    if (b.position.y - (a.size[1]/2) > bounds.y + bounds.h + 40) {
      Matter.World.remove(entities.physics.world, b);
      delete entities[key];
    }
  });
  return entities;
};

const Collisions = (entities, { dispatch }) => {
  const player = entities.player;
  if (!player?.body) return entities;

  const px1 = player.body.position.x - PLAYER_W/2;
  const py1 = player.body.position.y - PLAYER_H/2;
  const px2 = px1 + PLAYER_W;
  const py2 = py1 + PLAYER_H;

  Object.keys(entities).forEach(key => {
    if (!key.startsWith('star_')) return;
    const a = entities[key];
    const b = a.body;
    const sx1 = b.position.x - a.size[0]/2;
    const sy1 = b.position.y - a.size[1]/2;
    const sx2 = sx1 + a.size[0];
    const sy2 = sy1 + a.size[1];
    const hit = !(sx2 < px1 || sx1 > px2 || sy2 < py1 || sy1 > py2);
    if (hit) {
      dispatch({ type: 'caught', value: 1 });
      Matter.World.remove(entities.physics.world, b);
      delete entities[key];
    }
  });
  return entities;
};

/* ─ JournalScreen (Catch the Stars) ─ */
export default function JournalScreen({ navigation }) {
  const areaW = useMemo(() => Math.max(260, Math.round(SCREEN_W - 32)), []);
  const areaX = (SCREEN_W - areaW) / 2;

  const [canPlay, setCanPlay]   = useState(true);
  const [coolLeft, setCoolLeft] = useState(0);
  const [playing, setPlaying]   = useState(false);
  const [score, setScore]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_MS / 1000);
  const [result, setResult]     = useState(null);
  const [selectedChar, setSelectedChar] = useState('wolf');
  const [showCharSelect, setShowCharSelect] = useState(false);

  const engineRef = useRef(null);
  const gameRef   = useRef(null);
  const [entities, setEntities] = useState(null);

  const CHARACTERS = [
    { key: 'wolf', name: 'Wolf' },
    { key: 'pigA', name: 'Hrumko' },
    { key: 'pigB', name: 'Rokhasik' },
    { key: 'pigC', name: 'Piskorokh' },
  ];

  /* Кулдаун 10 минут: тик раз в секунду */
  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const raw = await AsyncStorage.getItem(LAST_TS_KEY);
        const last = raw ? parseInt(raw, 10) || 0 : 0;
        const leftMs = Math.max(0, COOLDOWN_MS - (Date.now() - last));
        const leftSec = Math.ceil(leftMs / 1000);
        if (!mounted) return;
        setCoolLeft(leftSec);
        setCanPlay(leftSec <= 0);
    } catch {
        if (!mounted) return;
        setCoolLeft(0);
        setCanPlay(true);
    }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const makeEntities = useCallback(() => {
    const engine = Matter.Engine.create({ enableSleeping: false });
    engine.world.gravity.y = 0;

    const world = engine.world;
    const bounds = {
      x: areaX, y: 0, w: areaW, h: AREA_H,
      pageX: areaX,
    };

    const playerBody = Matter.Bodies.rectangle(
      bounds.x + bounds.w/2,
      bounds.y + bounds.h - EDGE_PAD - PLAYER_H/2,
      PLAYER_W, PLAYER_H,
      { isStatic: true, label: 'Player' }
    );
    Matter.World.add(world, [playerBody]);

    return {
      physics: { engine, world },
      bounds,
      spawner: { lastSpawnAt: null, nextSpawnIn: SPAWN_MS },
      player: {
        body: playerBody,
        size: [PLAYER_W, PLAYER_H],
        playerChar: selectedChar,
        renderer: (p) => <PlayerRenderer {...p} playerChar={selectedChar} />,
      },
    };
  }, [areaW, areaX, selectedChar]);

  const startGame = useCallback(() => {
    if (!canPlay || playing) return;

    setShowCharSelect(true);
  }, [canPlay, playing]);

  const confirmCharacter = useCallback(() => {
    setShowCharSelect(false);
    setPlaying(true);
    setScore(0);
    setTimeLeft(GAME_MS / 1000);
    setResult(null);

    const ents = makeEntities();
    engineRef.current = ents.physics.engine;
    setEntities(ents);

    const startedAt = Date.now();
    const t = setInterval(() => {
      const left = Math.max(0, GAME_MS - (Date.now() - startedAt));
      setTimeLeft(Math.ceil(left / 1000));
      if (left <= 0) {
        clearInterval(t);
        endGame(Math.max(1, Math.floor(score / 2)));
      }
    }, 1000);
    gameRef.current = { timer: t };
  }, [makeEntities, score]);

  const endGame = useCallback(async (reward) => {
    setPlaying(false);
    setResult(reward);

    try {
      const curRaw = await AsyncStorage.getItem(STARS_KEY);
      const cur    = curRaw ? parseInt(curRaw, 10) || 0 : 0;
      await AsyncStorage.multiSet([
        [STARS_KEY, String(cur + reward)],
        [LAST_TS_KEY, String(Date.now())],
      ]);
    } catch {}

    const eng = engineRef.current;
    if (eng) {
      const world = eng.world;
      Matter.World.clear(world, false);
      Matter.Engine.clear(eng);
    }
    if (gameRef.current?.timer) {
      clearInterval(gameRef.current.timer);
      gameRef.current.timer = null;
    }
  }, []);

  const onEvent = useCallback((e) => {
    if (!e || !e.type) return;
    if (e.type === 'caught') setScore(v => v + (e.value || 1));
  }, []);

  return (
    <ImageBackground source={ASSETS.bgBlur} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={!playing}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Catch the Characters!</Text>
                </View>

          {/* Card */}
          <View style={[styles.card, styles.shadowSoft]}>
            <Text style={styles.desc}>
              {canPlay
                ? (playing ? 'Move your character left/right and catch the falling friends!' : 'Catch characters to earn rewards!')
                : `Next play in ${mmss(coolLeft)}`
              }
            </Text>

            <View style={styles.statusRow}>
              <View style={styles.pill}><Text style={styles.pillTxt}>Score: {score}</Text></View>
              <View style={[styles.pill, { borderColor: COLORS.accent }]}><Text style={styles.pillTxt}>Time: {timeLeft}s</Text></View>
              {!canPlay && <View style={[styles.pill, { borderColor: COLORS.secondary }]}><Text style={styles.pillTxt}>Next: {mmss(coolLeft)}</Text></View>}
          </View>

            {/* Игровая область */}
            <View style={[styles.area, { height: AREA_H, width: '100%' }]}>
              <View style={styles.areaGlow} pointerEvents="none" />
              {entities && playing ? (
                <GameEngine
                  style={{ flex: 1 }}
                  systems={[TouchControl, SpawnStars, MoveStars, Collisions, Physics]}
                  entities={entities}
                  onEvent={onEvent}
                  running={true}
                />
              ) : (
                <View style={{ flex: 1 }} />
              )}
            </View>

            {/* Кнопка */}
            {!playing && (
              <ImgButton
                label={canPlay ? (result != null ? `You got +${result}★` : 'PLAY') : `WAIT ${mmss(coolLeft)}`}
                onPress={canPlay ? startGame : undefined}
                disabled={!canPlay}
              />
            )}
          </View>

          {/* немного контента ниже */}
          <View style={{ height: 36 }} />
        </ScrollView>

        <CustomTabBar
          active="journal"
          onHome={() => navigation.navigate('Home')}
          onSaved={() => navigation.navigate('Saved')}
          onGame={() => navigation.navigate('GameSetup')}
          onJournal={() => {}}
        />
      </SafeAreaView>

      {/* Модальное окно выбора персонажа */}
      {showCharSelect && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose your character:</Text>
            
            <View style={styles.charGrid}>
              {CHARACTERS.map((char) => (
                <Pressable
                  key={char.key}
                  onPress={() => setSelectedChar(char.key)}
                  style={[
                    styles.charCard,
                    selectedChar === char.key && styles.charCardActive
                  ]}
                >
                  <Image source={ASSETS[char.key]} style={styles.charImage} resizeMode="contain" />
                  <Text style={styles.charName}>{char.name}</Text>
                    </Pressable>
                  ))}
                </View>

            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButton} onPress={() => setShowCharSelect(false)}>
                <ImageBackground source={ASSETS.btnBg} style={styles.modalButtonBg} imageStyle={styles.modalButtonBgImg} resizeMode="stretch">
                  <Text style={styles.modalButtonText}>Cancel</Text>
                  </ImageBackground>
                </Pressable>
              
              <Pressable style={styles.modalButton} onPress={confirmCharacter}>
                <ImageBackground source={ASSETS.btnBg} style={styles.modalButtonBg} imageStyle={styles.modalButtonBgImg} resizeMode="stretch">
                  <Text style={styles.modalButtonText}>Start Game</Text>
                  </ImageBackground>
                </Pressable>
              </View>
            </View>
        </View>
      )}
    </ImageBackground>
  );
}

/* ─ Gold button ─ */
function ImgButton({ label, onPress, disabled }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        { opacity: disabled ? 0.45 : 1, transform: [{ translateY: pressed && !disabled ? 1 : 0 }] },
      ]}
    >
      <ImageBackground
        source={ASSETS.btnBg}
        resizeMode="stretch"
        capInsets={{ top: 60, left: 160, bottom: 60, right: 160 }}
        style={btn.bg}
        imageStyle={btn.image}
      >
        <LinearGradient colors={['#00BFFF', '#000080']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={btn.overlay} />
        <View style={btn.glow} />
        <View style={btn.shineL} />
        <View style={btn.shineR} />
        <Text style={btn.label}>{label}</Text>
      </ImageBackground>
    </Pressable>
  );
}

/* ─ styles ─ */
const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 28 },
  header: { alignItems:'center', marginBottom: 10 },
  title: {
    color: COLORS.title, fontSize: 32, fontFamily: FONTS.sigmar,
    textShadowColor: COLORS.accent, textShadowRadius: 10, textAlign: 'center',
  },

  card: { 
    backgroundColor: COLORS.card, 
    borderRadius: 28, 
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)', 
    padding: 16 
  },
  desc: { 
    color: COLORS.dim, 
    marginBottom: 12, 
    textAlign:'center',
    fontFamily: FONTS.sigmar,
    fontSize: 16,
  },

  statusRow: { flexDirection:'row', justifyContent:'center', gap: 8, marginBottom: 10, flexWrap:'wrap' },
  pill: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: 'rgba(0,0,0,0.25)',
  },
  pillTxt: { color: COLORS.text, fontFamily: FONTS.sigmar, fontSize: 14 },

  area: {
    borderRadius: 22, borderWidth: 1.5, borderColor: COLORS.line,
    backgroundColor: COLORS.card2, overflow: 'hidden', position: 'relative', marginBottom: 14,
  },
  areaGlow: {
    position:'absolute', left: -20, right: -20, top: -20, bottom: -20,
    shadowColor: COLORS.accent, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
  },

  shadowSoft: {
    shadowColor: COLORS.shadow, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width:0, height:4 }, elevation: 6
  },

  // Модальное окно выбора персонажа
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    minWidth: 320,
    maxWidth: SCREEN_W - 32,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  charGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  charCard: {
    width: 90,
    height: 120,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  charCardActive: {
    borderColor: '#000080',
    backgroundColor: 'rgba(0,0,128,0.1)',
  },
  charImage: {
    width: 70,
    height: 70,
    marginBottom: 4,
  },
  charName: {
    fontSize: 12,
    fontFamily: FONTS.sigmar,
    color: '#000080',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    width: 140,
    height: 120,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.sigmar,
    textAlign: 'center',
  },
});

const btn = StyleSheet.create({
  bg: {
    height: 100, borderRadius: 20, alignItems:'center', justifyContent:'center',
    paddingHorizontal: 24, overflow:'hidden', alignSelf:'stretch',
  },
  image: { borderRadius: 20 },
  overlay: { ...StyleSheet.absoluteFillObject, borderRadius: 20, opacity: 0.96 },
  glow:    { ...StyleSheet.absoluteFillObject, borderRadius: 20, shadowColor: COLORS.accent, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  shineL:  { position:'absolute', left:18, top:12, width:50, height:25, borderRadius:15, backgroundColor:'#FFFFFF', opacity:0.16 },
  shineR:  { position:'absolute', right:18, top:12, width:60, height:28, borderRadius:18, backgroundColor:'#FFFFFF', opacity:0.12 },
  label:   { color: '#FFFFFF', fontSize: 20, fontFamily: FONTS.sigmar, top: -2 },
});
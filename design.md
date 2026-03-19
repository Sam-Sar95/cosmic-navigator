# Cosmic Navigator - Design Document

## Overview
Cosmic Navigator è un'app mobile per il calcolo e l'interpretazione del tema astrale personale. L'app combina calcoli astronomici accurati con interpretazioni AI tramite Gemini, permettendo agli utenti di scoprire il loro profilo astrologico e confrontarlo con altri.

## Design Philosophy
- **Tema cosmico elegante**: Palette blu notte, viola cosmico, bianco stellare con accenti neon
- **Fluidità e micro-animazioni**: Transizioni morbide e reattive
- **Mobile-first**: Orientamento portrait 9:16, progettato per uso a una mano
- **Accessibilità**: Font moderni e leggibili, contrasti adeguati

## Screen List

### 1. **Onboarding Screen** (Splash + Welcome)
- Animazione di astronauta meditante su pianeta
- Titolo "Cosmic Navigator"
- Tagline: "Scopri il tuo tema astrale"
- CTA: "Inizia il viaggio" → Home

### 2. **Home Screen**
- Header con saluto personalizzato
- Sezione "Il mio tema astrale" (se disponibile)
- Quick actions:
  - "Crea nuovo tema"
  - "Visualizza temi salvati"
  - "Compatibilità"
- Sezione "Ultimi temi" (cronologia)

### 3. **Birth Data Input Screen**
- Form con campi:
  - Data di nascita (date picker)
  - Ora di nascita (time picker)
  - Luogo di nascita (location search)
- Validazione in tempo reale
- CTA: "Calcola tema astrale"

### 4. **Astral Theme Display Screen**
- Visualizzazione circolare del tema (zodiacale)
- Lista elementi astrologici:
  - Sole (☉)
  - Luna (☽)
  - Ascendente (AC)
  - Mercurio (☿)
  - Venere (♀)
  - Marte (♂)
  - Giove (♃)
  - Saturno (♄)
  - Urano (♅)
  - Nettuno (♆)
  - Plutone (♇)
  - Lilith (⚸)
  - Nodo Karmico (☊)
  - Chirone (⚷)
  - Medio Cielo (MC)
  - Case astrologiche (1-12)
- Tap su ogni elemento → Interpretazione Gemini

### 5. **Element Interpretation Screen**
- Visualizzazione elemento selezionato
- Interpretazione AI (Gemini)
- Tasto "Salva" per aggiungere ai preferiti
- Navigazione tra elementi

### 6. **Compatibility Screen**
- Selezione due temi da confrontare
- Visualizzazione grafica compatibilità
- Interpretazione AI delle compatibilità/incompatibilità
- Dettagli per ogni pianeta

### 7. **Profile Screen**
- Dati utente
- Lista temi salvati
- Opzioni: Modifica, Elimina, Condividi
- Impostazioni app

### 8. **Login/Register Screen**
- Opzioni:
  - Email/Password
  - Google OAuth
  - Apple OAuth
- Form di registrazione
- Link "Accedi" / "Registrati"

## Primary Content & Functionality

### Home Screen
- **Contenuto**: Saluto personalizzato, card con tema astrale attuale, quick actions
- **Funzionalità**: Navigazione verso creazione tema, visualizzazione temi, compatibilità

### Birth Data Input
- **Contenuto**: Form con data, ora, luogo
- **Funzionalità**: Validazione, calcolo tema tramite Swiss Ephemeris

### Astral Theme Display
- **Contenuto**: Visualizzazione circolare zodiacale, lista pianeti con gradi/segni
- **Funzionalità**: Tap su elemento → interpretazione, salvataggio tema

### Compatibility
- **Contenuto**: Due temi a confronto, grafico compatibilità
- **Funzionalità**: Selezione temi, visualizzazione interpretazione AI

## Key User Flows

### Flow 1: Creazione Tema Astrale
1. Utente tappa "Crea nuovo tema" da Home
2. Inserisce data, ora, luogo di nascita
3. App calcola tema tramite Swiss Ephemeris
4. Visualizza tema astrale con tutti gli elementi
5. Utente può tappar su ogni elemento per interpretazione
6. Salva tema nel profilo

### Flow 2: Interpretazione Elemento
1. Utente visualizza tema astrale
2. Tappa su un pianeta (es. Sole)
3. App invia dati a Gemini
4. Riceve interpretazione personalizzata
5. Può salvare interpretazione preferita

### Flow 3: Confronto Compatibilità
1. Utente accede a sezione "Compatibilità"
2. Seleziona due temi (suo + altro utente)
3. App calcola compatibilità planetaria
4. Invia a Gemini per interpretazione
5. Visualizza risultati con dettagli

### Flow 4: Login e Salvataggio
1. Utente accede con email/password o OAuth
2. Crea/modifica profilo
3. Temi salvati nel database personale
4. Accesso da qualsiasi dispositivo

## Color Palette

| Elemento | Colore | Uso |
|----------|--------|-----|
| Background | #0a0e27 | Sfondo principale (blu notte) |
| Primary | #7c3aed | Accenti principali (viola cosmico) |
| Secondary | #06b6d4 | Accenti secondari (ciano) |
| Accent | #00ff88 | Neon highlights (verde neon) |
| Text Primary | #ffffff | Testo principale (bianco stellare) |
| Text Secondary | #a0aec0 | Testo secondario (grigio) |
| Surface | #1a1f3a | Card background (blu scuro) |
| Border | #2d3748 | Bordi (grigio scuro) |
| Success | #10b981 | Successo (verde) |
| Warning | #f59e0b | Avviso (arancione) |
| Error | #ef4444 | Errore (rosso) |

## Typography

- **Heading 1**: Inter Bold, 32px, line-height 1.2
- **Heading 2**: Inter Bold, 24px, line-height 1.3
- **Heading 3**: Inter SemiBold, 18px, line-height 1.4
- **Body**: Inter Regular, 16px, line-height 1.5
- **Caption**: Inter Regular, 12px, line-height 1.4

## Component Patterns

### Cards
- Background: `surface` con border `border`
- Border-radius: 16px
- Padding: 16px
- Shadow: Subtle shadow per profondità

### Buttons
- Primary: Background `primary`, text white
- Secondary: Background `surface`, text white, border `primary`
- Disabled: Opacity 0.5
- Press feedback: Scale 0.97 + haptic

### Input Fields
- Background: `surface`
- Border: `border`
- Focus: Border `primary`
- Padding: 12px
- Border-radius: 8px

### Zodiac Wheel
- Cerchio con 12 segni zodiacali
- Pianeti posizionati secondo gradi
- Colori per segno zodiacale
- Animazione smooth on load

## Animations & Transitions

- **Page transitions**: Fade in 200ms
- **Button press**: Scale 0.97 in 80ms
- **Element tap**: Highlight con opacity change
- **Loading**: Spinner rotante
- **Zodiac wheel**: Rotate in 400ms on load

## Accessibility

- Contrasti WCAG AA
- Font size minimo 14px
- Touch targets minimo 44x44pt
- Descrizioni alt per immagini
- Support per screen reader

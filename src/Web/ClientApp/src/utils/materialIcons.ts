/**
 * This file provides the required Material Community Icons for React Native Paper
 * It makes them available for web and prevents the warnings
 */
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Platform } from 'react-native';

// For web, we need to manually register the font
if (Platform.OS === 'web') {
  // Load Material Community Icons
  const iconFontStyles = `@font-face {
    src: url(${require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf')});
    font-family: MaterialCommunityIcons;
  }`;
  
  // Create stylesheet
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(iconFontStyles));
  document.head.appendChild(style);
}

export { MaterialCommunityIcons };
import {StyleProp, TextStyle, ViewStyle} from 'react-native';
import {Colors, ColorPalette} from './colors';

export class AppColors {
  private constructor() {}

  private static _instance: AppColors | null = null;
  public static get instance(): AppColors {
    if (AppColors._instance == null) {
      this._instance = new AppColors();
    }
    return this._instance!;
  }

  // Color values from ColorPalette
  primary = ColorPalette.primary;
  primaryDark = ColorPalette.primaryDark;
  primaryLight = ColorPalette.primaryLight;
  primaryactive = ColorPalette.primaryDark;
  secondary = ColorPalette.secondary;
  secondaryDark = ColorPalette.secondaryDark;
  secondaryLight = ColorPalette.secondaryLight;
  secondaryactive = ColorPalette.secondaryDark;
  success = ColorPalette.success;
  warning = ColorPalette.warning;
  danger = ColorPalette.error;
  dangeractive = ColorPalette.error;
  info = ColorPalette.info;
  white = ColorPalette.white;
  black = ColorPalette.black;
  text = ColorPalette.text;
  textSecondary = ColorPalette.textSecondary;
  textTertiary = ColorPalette.textTertiary;
  textInverse = ColorPalette.textInverse;
  textdark = ColorPalette.text;
  background = ColorPalette.background;
  backgroundSecondary = ColorPalette.backgroundSecondary;
  backgroundTertiary = ColorPalette.backgroundTertiary;
  border = ColorPalette.border;
  borderLight = ColorPalette.borderLight;
  borderDark = ColorPalette.borderDark;
  divider = ColorPalette.divider;
  inputBackground = ColorPalette.inputBackground;
  inputBorder = ColorPalette.inputBorder;
  inputFocus = ColorPalette.inputFocus;
  overlay = ColorPalette.overlay;
  overlayLight = ColorPalette.overlayLight;
  overlayDark = ColorPalette.overlayDark;
  transparent = ColorPalette.transparent;
  
  // Gray scale
  gray50 = ColorPalette.gray50;
  gray100 = ColorPalette.gray100;
  gray200 = ColorPalette.gray200;
  gray300 = ColorPalette.gray300;
  gray400 = ColorPalette.gray400;
  gray500 = ColorPalette.gray500;
  gray600 = ColorPalette.gray600;
  gray700 = ColorPalette.gray700;
  gray800 = ColorPalette.gray800;
  gray900 = ColorPalette.gray900;
  
  // Additional colors
  orange = ColorPalette.orange;
  darkGray = ColorPalette.darkGray;
  light = ColorPalette.backgroundSecondary;
  lightgrey = ColorPalette.gray200;
  grey = ColorPalette.gray300;
  dark = ColorPalette.gray800;
  muted = ColorPalette.textSecondary;
  light_gray = ColorPalette.gray100;
  cardbg = ColorPalette.backgroundSecondary;
  cardbg2 = ColorPalette.white;
  appbg = ColorPalette.backgroundSecondary;
  popupbg = ColorPalette.white;
  icon = ColorPalette.gray600;
  icondisabled = ColorPalette.gray400;

  /* text colors */
  text_primary: StyleProp<TextStyle> = {color: ColorPalette.primary};
  text_secondary: StyleProp<TextStyle> = {color: ColorPalette.secondary};
  text_danger: StyleProp<TextStyle> = {color: ColorPalette.error};
  text_warn: StyleProp<TextStyle> = {color: ColorPalette.warning};
  text_success: StyleProp<TextStyle> = {color: ColorPalette.success};
  text_info: StyleProp<TextStyle> = {color: ColorPalette.info};
  text_white: StyleProp<TextStyle> = {color: ColorPalette.white};
  text_black: StyleProp<TextStyle> = {color: ColorPalette.black};
  text_plain: StyleProp<TextStyle> = {color: ColorPalette.text};
  text_muted: StyleProp<TextStyle> = {color: ColorPalette.textSecondary};
  text_tertiary: StyleProp<TextStyle> = {color: ColorPalette.textTertiary};
  text_inverse: StyleProp<TextStyle> = {color: ColorPalette.textInverse};

  /* background colors */
  bg_primary: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.primary};
  bg_primaryDark: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.primaryDark};
  bg_primaryLight: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.primaryLight};
  bg_secondary: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.secondary};
  bg_secondaryDark: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.secondaryDark};
  bg_secondaryLight: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.secondaryLight};
  bg_white: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.white};
  bg_danger: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.error};
  bg_success: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.success};
  bg_warning: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.warning};
  bg_info: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.info};
  bg_light: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.backgroundSecondary};
  bg_dark: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.gray800};
  bg_background: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.background};
  bg_backgroundSecondary: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.backgroundSecondary};
  bg_backgroundTertiary: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.backgroundTertiary};
  bg_inputbg: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.inputBackground};
  bg_grey: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.gray300};
  bg_card: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.backgroundSecondary};
  bg_card2: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.white};
  bg_app: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.backgroundSecondary};
  bg_popupbg: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.white};
  bg_overlay: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.overlay};
  bg_overlayLight: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.overlayLight};
  bg_overlayDark: StyleProp<ViewStyle> = {backgroundColor: ColorPalette.overlayDark};

  /* border colors */
  border_default: StyleProp<ViewStyle> = {borderColor: ColorPalette.border};
  border_primary: StyleProp<ViewStyle> = {borderColor: ColorPalette.primary};
  border_secondary: StyleProp<ViewStyle> = {borderColor: ColorPalette.secondary};
  border_danger: StyleProp<ViewStyle> = {borderColor: ColorPalette.error};
  border_warn: StyleProp<ViewStyle> = {borderColor: ColorPalette.warning};
  border_success: StyleProp<ViewStyle> = {borderColor: ColorPalette.success};
  border_info: StyleProp<ViewStyle> = {borderColor: ColorPalette.info};
  border_light: StyleProp<ViewStyle> = {borderColor: ColorPalette.borderLight};
  border_dark: StyleProp<ViewStyle> = {borderColor: ColorPalette.borderDark};
  border_white: StyleProp<ViewStyle> = {borderColor: ColorPalette.white};
  border_input: StyleProp<ViewStyle> = {borderColor: ColorPalette.inputBorder};
  border_inputFocus: StyleProp<ViewStyle> = {borderColor: ColorPalette.inputFocus};
}

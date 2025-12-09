import {StyleProp, TextStyle} from 'react-native';

export class AppText {
  private constructor() {}

  private static _instance: AppText | null = null;
  public static get instance(): AppText {
    if (AppText._instance == null) {
      this._instance = new AppText();
    }
    return this._instance!;
  }

  h1: StyleProp<TextStyle> = {fontSize: 32, fontWeight: 'bold'};
  h2: StyleProp<TextStyle> = {fontSize: 24, fontWeight: 'bold'};
  h3: StyleProp<TextStyle> = {fontSize: 20, fontWeight: 'bold'};
  h4: StyleProp<TextStyle> = {fontSize: 18, fontWeight: '600'};
  h5: StyleProp<TextStyle> = {fontSize: 16, fontWeight: '500'};
  h6: StyleProp<TextStyle> = {fontSize: 14, fontWeight: '500'};
  h7: StyleProp<TextStyle> = {fontSize: 12, fontWeight: '500'};
  p: StyleProp<TextStyle> = {fontSize: 14};
  small: StyleProp<TextStyle> = {fontSize: 12};

  font_weight_bold: StyleProp<TextStyle> = {fontWeight: 'bold'};
  font_weight_400: StyleProp<TextStyle> = {fontWeight: '400'};
  font_weight_500: StyleProp<TextStyle> = {fontWeight: '500'};
  font_weight_600: StyleProp<TextStyle> = {fontWeight: '600'};
  font_weight_700: StyleProp<TextStyle> = {fontWeight: '700'};
  font_weight_light: StyleProp<TextStyle> = {fontWeight: 'normal'};

  /* alignment */
  text_left: StyleProp<TextStyle> = {textAlign: 'left'};
  text_center: StyleProp<TextStyle> = {textAlign: 'center'};
  text_right: StyleProp<TextStyle> = {textAlign: 'right'};
}

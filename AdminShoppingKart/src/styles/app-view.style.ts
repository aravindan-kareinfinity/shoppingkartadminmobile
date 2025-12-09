import {Dimensions, StyleProp, ViewStyle, StatusBar} from 'react-native';
import {Colors} from './colors';

export class AppView {
  private constructor() {}

  private static _instance: AppView | null = null;
  public static get instance(): AppView {
    if (AppView._instance == null) {
      this._instance = new AppView();
    }
    return this._instance!;
  }

  status_bar_height: number = StatusBar.currentHeight || 0;
  spacer: number = 8; // Base spacing unit

  width: number = Dimensions.get('window').width;
  height: number = Dimensions.get('window').height;

  /* misc */
  follow_statusbar: StyleProp<ViewStyle> = {
    marginTop: this.status_bar_height,
  };

  /* alignment */
  flex_1: StyleProp<ViewStyle> = {flex: 1};
  flex_column: StyleProp<ViewStyle> = {flexDirection: 'column'};
  flex_row: StyleProp<ViewStyle> = {flexDirection: 'row'};
  flex_wrap_wrap: StyleProp<ViewStyle> = {flexWrap: 'wrap'};
  justify_content_start: StyleProp<ViewStyle> = {justifyContent: 'flex-start'};
  justify_content_end: StyleProp<ViewStyle> = {justifyContent: 'flex-end'};
  justify_content_center: StyleProp<ViewStyle> = {justifyContent: 'center'};
  justify_content_spaceBetween: StyleProp<ViewStyle> = {
    justifyContent: 'space-between',
  };
  justify_content_spaceAround: StyleProp<ViewStyle> = {
    justifyContent: 'space-around',
  };
  align_items_start: StyleProp<ViewStyle> = {alignItems: 'flex-start'};
  align_items_end: StyleProp<ViewStyle> = {alignItems: 'flex-end'};
  align_items_center: StyleProp<ViewStyle> = {alignItems: 'center'};
  align_items_stretch: StyleProp<ViewStyle> = {alignItems: 'stretch'};
  align_self_start: StyleProp<ViewStyle> = {alignSelf: 'flex-start'};
  align_self_center: StyleProp<ViewStyle> = {alignSelf: 'center'};
  align_self_end: StyleProp<ViewStyle> = {alignSelf: 'flex-end'};

  /* margin */
  m_0: StyleProp<ViewStyle> = {margin: 0};
  m_1: StyleProp<ViewStyle> = {margin: this.spacer * 0.5};
  m_2: StyleProp<ViewStyle> = {margin: this.spacer};
  m_3: StyleProp<ViewStyle> = {margin: this.spacer * 1.5};
  m_4: StyleProp<ViewStyle> = {margin: this.spacer * 2};
  m_5: StyleProp<ViewStyle> = {margin: this.spacer * 2.5};
  m_6: StyleProp<ViewStyle> = {margin: this.spacer * 3};

  mt_1: StyleProp<ViewStyle> = {marginTop: this.spacer * 0.5};
  mt_2: StyleProp<ViewStyle> = {marginTop: this.spacer};
  mt_3: StyleProp<ViewStyle> = {marginTop: this.spacer * 1.5};
  mt_4: StyleProp<ViewStyle> = {marginTop: this.spacer * 2};
  mt_5: StyleProp<ViewStyle> = {marginTop: this.spacer * 2.5};
  mt_6: StyleProp<ViewStyle> = {marginTop: this.spacer * 3};

  mb_0: StyleProp<ViewStyle> = {marginBottom: 0};
  mb_05: StyleProp<ViewStyle> = {marginBottom: this.spacer * 0.25};
  mb_1: StyleProp<ViewStyle> = {marginBottom: this.spacer * 0.5};
  mb_2: StyleProp<ViewStyle> = {marginBottom: this.spacer};
  mb_3: StyleProp<ViewStyle> = {marginBottom: this.spacer * 1.5};
  mb_4: StyleProp<ViewStyle> = {marginBottom: this.spacer * 2};
  mb_5: StyleProp<ViewStyle> = {marginBottom: this.spacer * 2.5};
  mb_6: StyleProp<ViewStyle> = {marginBottom: this.spacer * 3};

  mr_1: StyleProp<ViewStyle> = {marginRight: this.spacer * 0.5};
  mr_2: StyleProp<ViewStyle> = {marginRight: this.spacer};
  mr_3: StyleProp<ViewStyle> = {marginRight: this.spacer * 1.5};
  mr_4: StyleProp<ViewStyle> = {marginRight: this.spacer * 2};
  mr_5: StyleProp<ViewStyle> = {marginRight: this.spacer * 2.5};

  ml_1: StyleProp<ViewStyle> = {marginLeft: this.spacer * 0.5};
  ml_2: StyleProp<ViewStyle> = {marginLeft: this.spacer};
  ml_3: StyleProp<ViewStyle> = {marginLeft: this.spacer * 1.5};
  ml_4: StyleProp<ViewStyle> = {marginLeft: this.spacer * 2};
  ml_5: StyleProp<ViewStyle> = {marginLeft: this.spacer * 2.5};

  mx_1: StyleProp<ViewStyle> = {marginHorizontal: this.spacer * 0.5};
  mx_2: StyleProp<ViewStyle> = {marginHorizontal: this.spacer};
  mx_3: StyleProp<ViewStyle> = {marginHorizontal: this.spacer * 1.5};
  mx_4: StyleProp<ViewStyle> = {marginHorizontal: this.spacer * 2};
  mx_5: StyleProp<ViewStyle> = {marginHorizontal: this.spacer * 2.5};

  my_1: StyleProp<ViewStyle> = {marginVertical: this.spacer * 0.5};
  my_2: StyleProp<ViewStyle> = {marginVertical: this.spacer};
  my_3: StyleProp<ViewStyle> = {marginVertical: this.spacer * 1.5};
  my_4: StyleProp<ViewStyle> = {marginVertical: this.spacer * 2};
  my_5: StyleProp<ViewStyle> = {marginVertical: this.spacer * 2.5};

  /* padding */
  p_05: StyleProp<ViewStyle> = {padding: this.spacer * 0.25};
  p_1: StyleProp<ViewStyle> = {padding: this.spacer * 0.5};
  p_2: StyleProp<ViewStyle> = {padding: this.spacer};
  p_3: StyleProp<ViewStyle> = {padding: this.spacer * 1.5};
  p_4: StyleProp<ViewStyle> = {padding: this.spacer * 2};
  p_5: StyleProp<ViewStyle> = {padding: this.spacer * 2.5};
  p_6: StyleProp<ViewStyle> = {padding: this.spacer * 3};

  pt_1: StyleProp<ViewStyle> = {paddingTop: this.spacer * 0.5};
  pt_2: StyleProp<ViewStyle> = {paddingTop: this.spacer};
  pt_3: StyleProp<ViewStyle> = {paddingTop: this.spacer * 1.5};
  pt_4: StyleProp<ViewStyle> = {paddingTop: this.spacer * 2};
  pt_5: StyleProp<ViewStyle> = {paddingTop: this.spacer * 2.5};

  pb_1: StyleProp<ViewStyle> = {paddingBottom: this.spacer * 0.5};
  pb_2: StyleProp<ViewStyle> = {paddingBottom: this.spacer};
  pb_3: StyleProp<ViewStyle> = {paddingBottom: this.spacer * 1.5};
  pb_4: StyleProp<ViewStyle> = {paddingBottom: this.spacer * 2};
  pb_5: StyleProp<ViewStyle> = {paddingBottom: this.spacer * 2.5};

  pr_1: StyleProp<ViewStyle> = {paddingRight: this.spacer * 0.5};
  pr_2: StyleProp<ViewStyle> = {paddingRight: this.spacer};
  pr_3: StyleProp<ViewStyle> = {paddingRight: this.spacer * 1.5};
  pr_4: StyleProp<ViewStyle> = {paddingRight: this.spacer * 2};
  pr_5: StyleProp<ViewStyle> = {paddingRight: this.spacer * 2.5};

  pl_1: StyleProp<ViewStyle> = {paddingLeft: this.spacer * 0.5};
  pl_2: StyleProp<ViewStyle> = {paddingLeft: this.spacer};
  pl_3: StyleProp<ViewStyle> = {paddingLeft: this.spacer * 1.5};
  pl_4: StyleProp<ViewStyle> = {paddingLeft: this.spacer * 2};
  pl_5: StyleProp<ViewStyle> = {paddingLeft: this.spacer * 2.5};

  px_1: StyleProp<ViewStyle> = {paddingHorizontal: this.spacer * 0.5};
  px_2: StyleProp<ViewStyle> = {paddingHorizontal: this.spacer};
  px_3: StyleProp<ViewStyle> = {paddingHorizontal: this.spacer * 1.5};
  px_4: StyleProp<ViewStyle> = {paddingHorizontal: this.spacer * 2};
  px_5: StyleProp<ViewStyle> = {paddingHorizontal: this.spacer * 2.5};
  px_6: StyleProp<ViewStyle> = {paddingHorizontal: this.spacer * 3};

  py_05: StyleProp<ViewStyle> = {paddingVertical: this.spacer * 0.25};
  py_1: StyleProp<ViewStyle> = {paddingVertical: this.spacer * 0.5};
  py_2: StyleProp<ViewStyle> = {paddingVertical: this.spacer};
  py_3: StyleProp<ViewStyle> = {paddingVertical: this.spacer * 1.5};
  py_4: StyleProp<ViewStyle> = {paddingVertical: this.spacer * 2};
  py_5: StyleProp<ViewStyle> = {paddingVertical: this.spacer * 2.5};
  py_6: StyleProp<ViewStyle> = {paddingVertical: this.spacer * 3};

  /* gap */
  gap_05: StyleProp<ViewStyle> = {gap: this.spacer * 0.25};
  gap_1: StyleProp<ViewStyle> = {gap: this.spacer * 0.5};
  gap_2: StyleProp<ViewStyle> = {gap: this.spacer};
  gap_3: StyleProp<ViewStyle> = {gap: this.spacer * 1.5};
  gap_4: StyleProp<ViewStyle> = {gap: this.spacer * 2};
  gap_5: StyleProp<ViewStyle> = {gap: this.spacer * 2.5};

  /* border */
  border: StyleProp<ViewStyle> = {borderWidth: 1};
  border_bottom: StyleProp<ViewStyle> = {borderBottomWidth: 1};
  border_top: StyleProp<ViewStyle> = {borderTopWidth: 1};
  border_right: StyleProp<ViewStyle> = {borderRightWidth: 1};
  border_left: StyleProp<ViewStyle> = {borderLeftWidth: 1};

  border_rounded_05: StyleProp<ViewStyle> = {borderRadius: 2};
  border_rounded: StyleProp<ViewStyle> = {borderRadius: 4};
  border_rounded_0: StyleProp<ViewStyle> = {borderRadius: 0};
  border_rounded_1: StyleProp<ViewStyle> = {borderRadius: 8};
  border_rounded_2: StyleProp<ViewStyle> = {borderRadius: 12};
  border_rounded_3: StyleProp<ViewStyle> = {borderRadius: 16};
  border_rounded_full: StyleProp<ViewStyle> = {borderRadius: 9999};

  /* width & height */
  w_100: StyleProp<ViewStyle> = {width: '100%'};
  h_100: StyleProp<ViewStyle> = {height: '100%'};

  /* elevation */
  elevation_1: StyleProp<ViewStyle> = {elevation: 1};
  elevation_2: StyleProp<ViewStyle> = {elevation: 2};
  elevation_3: StyleProp<ViewStyle> = {elevation: 3};
  elevation_4: StyleProp<ViewStyle> = {elevation: 4};
  elevation_5: StyleProp<ViewStyle> = {elevation: 5};

  /* opacity */
  opacity_50: StyleProp<ViewStyle> = {opacity: 0.5};
  opacity_75: StyleProp<ViewStyle> = {opacity: 0.75};

  /* shadows (using shadow styles) */
  shadow_small: StyleProp<ViewStyle> = {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  };
  shadow_medium: StyleProp<ViewStyle> = {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  };
  shadow_large: StyleProp<ViewStyle> = {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  };

  /* icon sizes */
  s_medium: StyleProp<ViewStyle> = {fontSize: 20};

  /* color references */
  tint_1: string = Colors.primary;
}

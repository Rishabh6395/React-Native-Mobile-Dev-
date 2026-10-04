import { StatusBar } from "expo-status-bar";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { colors } from "../../constants/theme";
import { ScreenWrapperProps } from "../../types";

const { height } = Dimensions.get("window");

const ScreenWrapper = ({ style, children }: ScreenWrapperProps) => {
  let paddingTop = Platform.OS == "android" ? height * 0.06 : 50;
  return (
    <View
      style={[
        {
          paddingTop,
          flex: 1,
          backgroundColor: colors.neutral900,
        },
        style,
      ]}
    >
      <StatusBar style="light" />
      {children}
    </View>
  );
};

export default ScreenWrapper;

const styles = StyleSheet.create({});

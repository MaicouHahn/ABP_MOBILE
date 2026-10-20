import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts, radius } from "../theme";

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, loading, disabled }: Props) {
  const inativo = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      style={({ pressed }) => [styles.botao, (pressed || inativo) && styles.pressionado]}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.texto}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pressionado: { opacity: 0.8 },
  texto: { fontFamily: fonts.extrabold, fontSize: 16, color: "#FFFFFF" },
});

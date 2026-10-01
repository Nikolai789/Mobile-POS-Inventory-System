import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import Layout from "./branding_style/layout";
import Font from "./branding_style/font";

export default function root() {
  return (
  <View style={Layout.container}>
      <View style={Layout.header}>
        <Text style={Font.h1_zen_text}>Dashboard</Text>
      </View>
  </View>
  )
  // Below is the frozen code
  // type Metric = {
  //   label: string;
  //   value: string;
  //   tone: "blue" | "green" | "orange" | "red";
  // };

  // const metrics: Metric[] = [
  //   { label: "Items\nTracked", value: "32", tone: "blue" },
  //   { label: "Revenue\nEarned", value: "$2111", tone: "green" },
  //   { label: "Expenses", value: "$321.2", tone: "orange" },
  //   { label: "Low Stock", value: "12", tone: "red" },
  // ];

  // const metricToneStyles = {
  //   blue: { backgroundColor: "#b4b8bd" },
  //   green: { backgroundColor: "#b4b8bd" },
  //   orange: { backgroundColor: "#b4b8bd" },
  //   red: { backgroundColor: "#b4b8bd" },
  // };

  // const sales = [
  //   { name: "Water Bottle", sold: "31", profit: "$301" },
  //   { name: "Water Bottle", sold: "31", profit: "$301" },
  //   { name: "Water Bottle", sold: "31", profit: "$301" },
  //   { name: "Water Bottle", sold: "31", profit: "$301" },
  //   { name: "Water Bottle", sold: "31", profit: "$301" },
  // ];

  // function DashboardIcon() {
  //   return (
  //     <View style={styles.chartIcon}>
  //       <View style={[styles.chartBar, styles.chartBarShort]} />
  //       <View style={[styles.chartBar, styles.chartBarMedium]} />
  //       <View style={[styles.chartBar, styles.chartBarTall]} />
  //     </View>
  //   );
  // }

  // function ReportIcon() {
  //   return (
  //     <View style={styles.reportIcon}>
  //       <View style={styles.reportLine} />
  //       <View style={styles.reportLine} />
  //       <View style={styles.reportBadge} />
  //     </View>
  //   );
  // }

  // function InventoryIcon() {
  //   return (
  //     <View style={styles.inventoryIcon}>
  //       <View style={styles.inventoryClip} />
  //       <View style={styles.inventoryLine} />
  //       <View style={styles.inventoryLine} />
  //       <View style={styles.inventoryLine} />
  //     </View>
  //   );
  // }

  // export default function Index() {
  //   return (
  //     <SafeAreaView style={styles.safeArea}>
  //       <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
  //         <View style={styles.header}>
  //           <View>
  //             <Text style={styles.brand}>JNY Minimart</Text>
  //           </View>
  //           <View style={styles.profileCircle}>
  //             <Text style={styles.profileText}>J</Text>
  //           </View>
  //         </View>

  //         <View style={styles.metricsGrid}>
  //           {metrics.map((metric) => (
  //             <View key={metric.label} style={[styles.metricCard, metricToneStyles[metric.tone]]}>
  //               <Text style={styles.metricLabel}>{metric.label}</Text>
  //               <Text style={styles.metricValue}>{metric.value}</Text>
  //             </View>
  //           ))}
  //         </View>

  //         <View style={styles.reportCard}>
  //           <View style={styles.reportHeader}>
  //             <Text style={styles.reportTitle}>Sales Report</Text>
  //             <Text style={styles.moreDetails}>More Details</Text>
  //           </View>

  //           <View style={styles.tableHeader}>
  //             <Text style={[styles.tableHeaderText, styles.nameColumn]}>Name</Text>
  //             <Text style={[styles.tableHeaderText, styles.soldColumn]}>Sold</Text>
  //             <Text style={[styles.tableHeaderText, styles.profitColumn]}>Profit</Text>
  //           </View>

  //           {sales.map((sale, index) => (
  //             <View key={`${sale.name}-${index}`} style={styles.tableRow}>
  //               <Text style={[styles.tableText, styles.nameColumn]} numberOfLines={1}>{sale.name}</Text>
  //               <Text style={[styles.tableText, styles.soldColumn]}>{sale.sold}</Text>
  //               <Text style={[styles.tableText, styles.profitColumn]}>{sale.profit}</Text>
  //             </View>
  //           ))}
  //         </View>
  //       </ScrollView>

  //       <View style={styles.bottomBar}>
  //         <View style={styles.navItem}>
  //           <DashboardIcon />
  //           <Text style={[styles.navLabel, styles.activeNavLabel]}>Dashboard</Text>
  //         </View>
  //         <Link href="/screens/purchases" asChild>
  //           <Pressable style={styles.navItem}>
  //             <ReportIcon />
  //             <Text style={styles.navLabel}>Sales Report</Text>
  //           </Pressable>
  //         </Link>
  //         <Link href="/screens/Inventory" asChild>
  //           <Pressable style={styles.navItem}>
  //             <InventoryIcon />
  //             <Text style={styles.navLabel}>Inventory</Text>
  //           </Pressable>
  //         </Link>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  // const styles = StyleSheet.create({
  //   safeArea: {
  //     flex: 1,
  //     backgroundColor: "#f8f8f8",
  //   },
  //   content: {
  //     padding: 24,
  //     paddingBottom: 120,
  //   },
  //   header: {
  //     flexDirection: "row",
  //     alignItems: "flex-start",
  //     justifyContent: "space-between",
  //     marginBottom: 28,
  //   },
  //   brand: {
  //     color: "#111111",
  //     fontSize: 28,
  //     fontWeight: "800",
  //     letterSpacing: 0,
  //   },
  //   profileCircle: {
  //     alignItems: "center",
  //     backgroundColor: "#111111",
  //     borderRadius: 22,
  //     height: 44,
  //     justifyContent: "center",
  //     width: 44,
  //   },
  //   profileText: {
  //     color: "#ffffff",
  //     fontSize: 18,
  //     fontWeight: "700",
  //   },
  //   metricsGrid: {
  //     flexDirection: "row",
  //     flexWrap: "wrap",
  //     gap: 12,
  //     justifyContent: "space-between",
  //     marginBottom: 18,
  //   },
  //   metricCard: {
  //     borderRadius: 10,
  //     height: 154,
  //     justifyContent: "space-between",
  //     padding: 16,
  //     width: "48%",
  //   },
  //   metricLabel: {
  //     color: "#171717",
  //     fontSize: 18,
  //     fontWeight: "700",
  //     lineHeight: 23,
  //   },
  //   metricValue: {
  //     alignSelf: "flex-end",
  //     color: "#111111",
  //     fontFamily: "serif",
  //     fontSize: 42,
  //   },
  //   reportCard: {
  //     backgroundColor: "#ffffff",
  //     borderRadius: 12,
  //     padding: 16,
  //   },
  //   reportHeader: {
  //     alignItems: "center",
  //     flexDirection: "row",
  //     justifyContent: "space-between",
  //     marginBottom: 18,
  //   },
  //   reportTitle: {
  //     color: "#111111",
  //     fontFamily: "serif",
  //     fontSize: 25,
  //   },
  //   moreDetails: {
  //     color: "#555555",
  //     fontSize: 12,
  //     textDecorationLine: "underline",
  //   },
  //   tableHeader: {
  //     alignItems: "center",
  //     backgroundColor: "#f0f1f3",
  //     borderRadius: 8,
  //     flexDirection: "row",
  //     marginBottom: 4,
  //     paddingVertical: 10,
  //   },
  //   tableHeaderText: {
  //     color: "#222222",
  //     fontSize: 13,
  //     fontWeight: "700",
  //     textAlign: "center",
  //   },
  //   tableRow: {
  //     alignItems: "center",
  //     flexDirection: "row",
  //     minHeight: 34,
  //   },
  //   tableText: {
  //     color: "#333333",
  //     fontFamily: "serif",
  //     fontSize: 12,
  //     textAlign: "center",
  //   },
  //   nameColumn: { flex: 1.8 },
  //   soldColumn: { flex: 0.8 },
  //   profitColumn: { flex: 1 },
  //   bottomBar: {
  //     alignItems: "center",
  //     backgroundColor: "#ffffff",
  //     borderTopColor: "#e5e5e5",
  //     borderTopWidth: 1,
  //     bottom: 0,
  //     flexDirection: "row",
  //     justifyContent: "space-around",
  //     left: 0,
  //     paddingBottom: 10,
  //     paddingTop: 12,
  //     position: "absolute",
  //     right: 0,
  //   },
  //   navItem: {
  //     alignItems: "center",
  //     minWidth: 84,
  //   },
  //   navLabel: {
  //     color: "#666666",
  //     fontSize: 11,
  //     fontWeight: "600",
  //     marginTop: 6,
  //   },
  //   activeNavLabel: { color: "#111111" },
  //   chartIcon: {
  //     alignItems: "flex-end",
  //     borderBottomColor: "#111111",
  //     borderBottomWidth: 2,
  //     flexDirection: "row",
  //     gap: 3,
  //     height: 25,
  //     justifyContent: "center",
  //     width: 25,
  //   },
  //   chartBar: {
  //     backgroundColor: "#111111",
  //     width: 5
  //   },
  //   chartBarShort: {
  //     height: 8
  //   },
  //   chartBarMedium: {
  //     height: 15
  //   },
  //   chartBarTall: {
  //     height: 23
  //   },
  //   reportIcon: {
  //     borderColor: "#111111",
  //     borderRadius: 4,
  //     borderWidth: 2,
  //     height: 25,
  //     justifyContent: "center",
  //     paddingHorizontal: 4,
  //     width: 25,
  //   },
  //   reportLine: {
  //     backgroundColor: "#111111",
  //     height: 2,
  //     marginVertical: 2,
  //     width: 12 },
  //   reportBadge: {
  //     backgroundColor: "#111111",
  //     borderRadius: 4,
  //     height: 7,
  //     position: "absolute",
  //     right: -4,
  //     top: -4,
  //     width: 7 },
  //   inventoryIcon: {
  //     borderColor: "#111111",
  //     borderRadius: 2,
  //     borderWidth: 2,
  //     height: 25,
  //     justifyContent: "center",
  //     paddingHorizontal: 4,
  //     width: 23,
  //   },
  //   inventoryClip: {
  //     backgroundColor: "#111111",
  //     height: 4,
  //     position: "absolute",
  //     top: -4,
  //     width: 9 },
  //   inventoryLine: {
  //     backgroundColor: "#111111",
  //     height: 2,
  //     marginVertical: 2,
  //     width: 12 },
  // });

}

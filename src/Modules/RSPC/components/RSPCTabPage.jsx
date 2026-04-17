import PropTypes from "prop-types";
import { useRef } from "react";
import { Tabs, Button, Flex, Text } from "@mantine/core";
import { CaretCircleLeft, CaretCircleRight } from "@phosphor-icons/react";
import RSPCBreadcrumbs from "./RSPCBreadcrumbs";
import classes from "../styles/researchProjectsStyle.module.css";

function RSPCTabPage({ breadcrumbTitle, breadcrumbExtra, tabItems, activeTab, setActiveTab }) {
  const tabsListRef = useRef(null);

  const handleTabChange = (direction) => {
    const newIndex = direction === "next"
      ? Math.min(+activeTab + 1, tabItems.length - 1)
      : Math.max(+activeTab - 1, 0);
    setActiveTab(String(newIndex));
    tabsListRef.current?.scrollBy({ left: direction === "next" ? 50 : -50, behavior:"smooth" });
  };

  return (
    <>
      <RSPCBreadcrumbs projectTitle={breadcrumbTitle} extra={breadcrumbExtra} />
      <Flex justify="space-between" align="center" mt="lg">
        <Flex justify="flex-start" align="center">
          <Button onClick={() => handleTabChange("prev")} variant="subtle" p={0} mr={4}
            color="#15ABFF" disabled={+activeTab === 0}>
            <CaretCircleLeft size={28} />
          </Button>
          <div className={classes.fusionTabsContainer} ref={tabsListRef}>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List style={{flexWrap:"nowrap"}}>
                {tabItems.map((item, i) => (
                  <Tabs.Tab key={i} value={String(i)}
                    className={activeTab === String(i) ? classes.fusionActiveRecentTab : ""}>
                    <Text className={classes.fusionText}>{item.title}</Text>
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </div>
          <Button onClick={() => handleTabChange("next")} variant="subtle" p={0} ml={4}
            color="#15ABFF" disabled={+activeTab === tabItems.length - 1}>
            <CaretCircleRight size={28} />
          </Button>
        </Flex>
      </Flex>

      <div style={{marginTop:16}}>
        {tabItems[+activeTab]?.component}
      </div>
    </>
  );
}

RSPCTabPage.propTypes = {
  breadcrumbTitle: PropTypes.string,
  breadcrumbExtra: PropTypes.string,
  tabItems: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    component: PropTypes.node.isRequired,
  })).isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};
export default RSPCTabPage;

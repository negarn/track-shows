import type { Meta, StoryObj } from "@storybook/react";
import { CalendarPage } from "./CalendarPage";

const meta = {
  title: "Pages/Calendar",
  component: CalendarPage,
  parameters: {
    layout: "fullscreen"
  },
  args: {
    episodes: [],
    isLoading: false,
    onNextWeek: () => undefined,
    onPreviousWeek: () => undefined,
    onToggleWatched: () => undefined
  }
} satisfies Meta<typeof CalendarPage>;

export default meta;

type Story = StoryObj<typeof meta>;

function renderCalendarPage(args: Story["args"] = {}) {
  return <CalendarPage {...args} weekStart={new Date(2024, 0, 1)} />;
}

export const Empty: Story = {
  render: renderCalendarPage
};

export const Loading: Story = {
  render: renderCalendarPage,
  args: {
    isLoading: true
  }
};

import { AltArrowLeftIcon } from "@solar-icons/react/linear/alt-arrow-left";
import { BackpackIcon } from "@solar-icons/react/linear/backpack";
import { CalendarIcon } from "@solar-icons/react/linear/calendar";
import { ChatRoundDotsIcon } from "@solar-icons/react/linear/chat-round-dots";
import { CheckReadIcon } from "@solar-icons/react/linear/check-read";
import { CloseCircleIcon } from "@solar-icons/react/linear/close-circle";
import { ChefHatIcon } from "@solar-icons/react/linear/chef-hat";
import { ClockCircleIcon } from "@solar-icons/react/linear/clock-circle";
import { CompassIcon } from "@solar-icons/react/linear/compass";
import { GalleryIcon } from "@solar-icons/react/linear/gallery";
import { HikingIcon } from "@solar-icons/react/linear/hiking";
import { MapIcon } from "@solar-icons/react/linear/map";
import { MapPointIcon } from "@solar-icons/react/linear/map-point";
import { LockKeyholeIcon } from "@solar-icons/react/linear/lock-keyhole";
import { Login2Icon } from "@solar-icons/react/linear/login-2";
import { Logout2Icon } from "@solar-icons/react/linear/logout-2";
import { MoonIcon } from "@solar-icons/react/linear/moon";
import { PlaneIcon } from "@solar-icons/react/linear/plane";
import { RoutingIcon } from "@solar-icons/react/linear/routing";
import { ShieldCheckIcon } from "@solar-icons/react/linear/shield-check";
import { StarsMinimalisticIcon } from "@solar-icons/react/linear/stars-minimalistic";
import { UsersGroupRoundedIcon } from "@solar-icons/react/linear/users-group-rounded";
import { WalletMoneyIcon } from "@solar-icons/react/linear/wallet-money";
import { WheelIcon } from "@solar-icons/react/linear/wheel";

export type IconName =
  | "arrow"
  | "bag"
  | "calendar"
  | "car"
  | "chat"
  | "check"
  | "clock"
  | "close"
  | "compass"
  | "food"
  | "image"
  | "lock"
  | "login"
  | "logout"
  | "map"
  | "moon"
  | "mountain"
  | "pin"
  | "route"
  | "send"
  | "shield"
  | "spark"
  | "users"
  | "wallet";

const icons = {
  arrow: AltArrowLeftIcon,
  bag: BackpackIcon,
  calendar: CalendarIcon,
  car: WheelIcon,
  chat: ChatRoundDotsIcon,
  check: CheckReadIcon,
  clock: ClockCircleIcon,
  close: CloseCircleIcon,
  compass: CompassIcon,
  food: ChefHatIcon,
  image: GalleryIcon,
  lock: LockKeyholeIcon,
  login: Login2Icon,
  logout: Logout2Icon,
  map: MapIcon,
  moon: MoonIcon,
  mountain: HikingIcon,
  pin: MapPointIcon,
  route: RoutingIcon,
  send: PlaneIcon,
  shield: ShieldCheckIcon,
  spark: StarsMinimalisticIcon,
  users: UsersGroupRoundedIcon,
  wallet: WalletMoneyIcon,
} satisfies Record<IconName, typeof CompassIcon>;

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const SolarIcon = icons[name];
  return <SolarIcon className={className} />;
}

import Image from "next/image";

export const getBetIcon = (bet: string | null) => {
  switch (bet) {
    case "Rock":
      return <Image src="/rock.png" alt="Rock" width={50} height={50} />;
    case "Paper":
      return <Image src="/paper.png" alt="Paper" width={50} height={50} />;
    case "Scissors":
      return <Image src="/scissors.png" alt="Scissors" width={50} height={50} />;
    default:
      return null;
  }
};
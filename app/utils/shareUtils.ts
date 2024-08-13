export const shareGame = (id: string, setShowShareButton: (show: boolean) => void, setCopyMessage: (message: string) => void) => {
    const gameUrl = `https://www.gudgame.lol/spl/rps-spl-game/${id}`;
    navigator.clipboard.writeText(gameUrl).then(() => {
      setShowShareButton(false);
      setCopyMessage("Game link copied. You can send it to your friends.");
      setTimeout(() => {
        setShowShareButton(true);
        setCopyMessage("");
      }, 3000);
    });
  };
  
  export const shareOnTwitter = (bet: any, wallet: any) => {
    if (bet && wallet.publicKey) {
      const formattedAmount = Number(bet.bet_amount * 2).toFixed(2);
      let tweetText = "";
  
      if (!bet.bet_taker_address) {
        tweetText = `Play me in Rock Paper Scissors @gudgamelol! Winner gets ${formattedAmount} SOL - ${window.location.href}`;
      } else if (bet.winner_address) {
        if (bet.winner_address === "DRAW") {
          tweetText = `I just drew a game of Rock Paper Scissors on @gudgamelol! What are the odds? Check it out: www.gudgame.lol`;
        } else if (bet.winner_address === wallet.publicKey.toBase58()) {
          tweetText = `I just won ${formattedAmount} SOL playing Rock Paper Scissors on @gudgamelol! 🎉 Want to challenge me? www.gudgame.lol`;
        } else {
          tweetText = `I just lost a nail-biting game of Rock Paper Scissors on @gudgamelol. Ready for a rematch? www.gudgame.lol`;
        }
      }
  
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(twitterUrl, "_blank");
    }
  };
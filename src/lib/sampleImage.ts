export async function createSampleImage(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 760;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not create a sample image.");

  const roundRect = (x: number, y: number, w: number, h: number, radius: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  };
  ctx.fillStyle = "#f0faf7";
  ctx.fillRect(0, 0, 1200, 760);
  ctx.fillStyle = "#fffdfa";
  ctx.fillRect(0, 0, 1200, 88);
  ctx.fillStyle = "#006d94";
  ctx.font = "bold 28px Arial";
  ctx.fillText("YourBrand", 48, 55);
  ctx.fillStyle = "#163d50";
  ctx.font = "bold 16px Arial";
  ctx.fillText("Home       Features       Pricing       About", 660, 53);
  roundRect(1050, 25, 110, 38, 12, "#0a86ae");
  ctx.fillStyle = "white";
  ctx.font = "bold 15px Arial";
  ctx.fillText("Get Started", 1063, 49);

  const hero = ctx.createLinearGradient(0, 100, 1200, 490);
  hero.addColorStop(0, "#e3f7f1");
  hero.addColorStop(1, "#b3e8e0");
  ctx.fillStyle = hero;
  ctx.fillRect(0, 88, 1200, 425);
  ctx.fillStyle = "#0c8da8";
  ctx.font = "bold 15px Arial";
  ctx.fillText("A BETTER WAY TO BUILD", 50, 185);
  ctx.fillStyle = "#07354c";
  ctx.font = "bold 62px Arial";
  ctx.fillText("Build Amazing", 50, 260);
  ctx.fillText("Digital Experiences", 50, 330);
  ctx.font = "20px Arial";
  ctx.fillText("Beautiful, responsive websites for your next big idea.", 52, 374);
  roundRect(50, 409, 160, 54, 12, "#0786ad");
  ctx.fillStyle = "white";
  ctx.font = "bold 17px Arial";
  ctx.fillText("Get Started", 72, 443);

  roundRect(695, 163, 390, 258, 18, "#063b51");
  roundRect(711, 179, 358, 222, 5, "#fbfffe");
  roundRect(730, 198, 320, 24, 4, "#e3f2f0");
  roundRect(730, 236, 67, 146, 4, "#e6f4f2");
  roundRect(812, 238, 202, 70, 7, "#0b92af");
  for (let i = 0; i < 4; i += 1) roundRect(813, 323 + i * 15, 165 - i * 20, 7, 4, "#c9e0df");
  roundRect(675, 420, 430, 13, 7, "#78aab0");
  roundRect(1025, 270, 91, 182, 16, "#07374d");
  roundRect(1033, 283, 75, 157, 8, "#f8fffd");
  roundRect(1042, 315, 56, 34, 5, "#9bd8d7");
  roundRect(1042, 358, 56, 34, 5, "#1198af");

  const titles = ["Fast Performance", "Modern Design", "Fully Responsive", "Easy to Customize"];
  for (let i = 0; i < 4; i += 1) {
    const x = 29 + i * 295;
    roundRect(x, 540, 270, 184, 16, "#fffdfa");
    roundRect(x + 23, 563, 46, 46, 12, "#c3eeeb");
    ctx.fillStyle = "#0789ad";
    ctx.font = "bold 25px Arial";
    ctx.fillText(["\u2197", "\u25ce", "\u25a3", "\u2713"][i], x + 34, 595);
    ctx.fillStyle = "#08384e";
    ctx.font = "bold 19px Arial";
    ctx.fillText(titles[i], x + 23, 646);
    ctx.fillStyle = "#537787";
    ctx.font = "15px Arial";
    ctx.fillText("Thoughtful details for every device.", x + 23, 678);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Your browser could not create a sample image.");
  return new File([blob], "sample-website-design.png", { type: "image/png" });
}
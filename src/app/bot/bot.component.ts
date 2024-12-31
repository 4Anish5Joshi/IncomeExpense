import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-bot',
  templateUrl: './bot.component.html',
  styleUrls: ['./bot.component.scss'],
})
export class BotComponent implements OnInit {
  showMessage = false;

  ngOnInit() {
    this.startShakeAnimation(); // Start the shake animation when the component is initialized
  }

  toggleMessage() {
    this.showMessage = !this.showMessage; // Toggle visibility of the message
  }

  startShakeAnimation() {
    const botIcon = document.querySelector('.bot-icon') as HTMLElement;

    // Set the animation play state to running every 5 seconds
    setInterval(() => {
      if (botIcon) {
        botIcon.style.animationPlayState = 'running'; // Start shaking
        // Reset the animation after it's done
        setTimeout(() => {
          botIcon.style.animationPlayState = 'paused'; // Pause after shaking
        }, 500); // Duration of the shake animation
      }
    }, 3000); // Repeat every 5 seconds
  }
}

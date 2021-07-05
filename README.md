
<!-- PROJECT LOGO -->
<br />
<p align="center">

  <h3 align="center">NFTicketize</h3>

  <p align="center">
    NFTicketize is app for create events (Concerts,  Conferences, Festivals, Seminars, Sports, etc), create ticket categories for that events, buy tickets that are created as NFT's, and trade that tickets for cryptocurrency, for some other ticket, or for some other NFT.
    <br />
  <a href="https://www.youtube.com/watch?v=eGvdrB52n2o"><strong>Application Demo</strong></a>
    <br />
  </p>
</p>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

* Home (all events) - display all events for which users could buy tickets. With button "Detail" user could open form with detail information about that event.

![1](https://user-images.githubusercontent.com/25621259/124457276-e8bfab00-dd8b-11eb-998c-e29a74006b68.png)


* My tickets - display all tickets that user owns


* My events - events that logged user created
  
  - Display
  
![2](https://user-images.githubusercontent.com/25621259/124457332-f9702100-dd8b-11eb-9ac3-69e7139a139c.png)

  - Button "New event" (create new event)
  
 ![3](https://user-images.githubusercontent.com/25621259/124459043-068e0f80-dd8e-11eb-8c5c-76629628ae8c.png)


* Create (modified) event - full screen

![Screenshot_2021-05-30-15-21-35](https://user-images.githubusercontent.com/25621259/120106029-b652da80-c15b-11eb-8bf8-ad3db8b7f629.png)
![Screenshot_2021-05-30-15-24-38](https://user-images.githubusercontent.com/25621259/120106030-b6eb7100-c15b-11eb-9c9c-c750362c45e5.png)


* Create (modified) event - Integration with RAMP Network, so that assets (cryptocurrencies) from RAMP network are displayed in application as possible cryptocurrency for payment

![Screenshot_2021-05-30-15-25-33](https://user-images.githubusercontent.com/25621259/120106256-a1c31200-c15c-11eb-8461-46ec6ee6e554.png)


* Create (modified) event - Integration with RAMP Network, so that minimum ticket price cannot be lower than minimum puchase amount for selected cryptocurrency

![Screenshot_2021-05-30-15-22-14](https://user-images.githubusercontent.com/25621259/120106326-e0f16300-c15c-11eb-95b3-891933ad0e18.png)


* Buy ticket - Integration with RAMP Network

![Screenshot_2021-05-30-15-40-53](https://user-images.githubusercontent.com/25621259/120106666-498d0f80-c15e-11eb-9542-6827cbc158ee.png)
![Screenshot_2021-05-30-15-41-14](https://user-images.githubusercontent.com/25621259/120106668-4a25a600-c15e-11eb-8c43-44078f4b7db2.png)


* Menu

![Screenshot_2021-05-30-15-43-48](https://user-images.githubusercontent.com/25621259/120106729-8527d980-c15e-11eb-8555-c7d2d29b5c9a.png)


* My tickets display

![Screenshot_2021-05-30-15-45-11](https://user-images.githubusercontent.com/25621259/120106742-8eb14180-c15e-11eb-85ab-099a57f9e5dd.png)

### Built With

This project is built with:
* [Kotlin](https://kotlinlang.org/)
* [RAMP Network](https://ramp.network/)
* [Firebase](https://firebase.google.com/)

<!-- GETTING STARTED -->
## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/StefanVitor/CCEventize.git
   ```
2. Create project on Firebas and import google-services.json on app directory

3. Get API key from RAMP Network



<!-- ROADMAP -->
## Roadmap

* Integration with smart contracts, so informations about who buy ticket, how many tickets are sold or how many tickets are available, are stored on blockchain

* Development of new functionalities, such as print tickets as pdf or QR code, different ticket types (different ticket price for same event)

* Application design

* Test cases




<!-- CONTRIBUTING -->
## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the GNU General Public License v3.0. See `LICENSE` for more information.



<!-- CONTACT -->
## Contact

Stefan Vitorovic - [@StefanVitorovic](https://twitter.com/StefanVitorovic) - vitorovicstefan@gmail.com

Project Link: [https://github.com/StefanVitor/CCEventize](https://github.com/StefanVitor/CCEventize)



<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements
* [Gitcoin](https://gitcoin.co/)
* [RAMP Network](https://ramp.network/)



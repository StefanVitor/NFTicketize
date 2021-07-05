
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
  - Button "New event" (create new event)
  
![2](https://user-images.githubusercontent.com/25621259/124457332-f9702100-dd8b-11eb-9ac3-69e7139a139c.png)

![3](https://user-images.githubusercontent.com/25621259/124459043-068e0f80-dd8e-11eb-8c5c-76629628ae8c.png)


* Event detail - from event creator view 

  - Display
  - Button "New ticket category"
    - Field "Resell fee for event owner" shows how much percent for every resell for tickets in that ticket category will event creator get

![4](https://user-images.githubusercontent.com/25621259/124464327-5bcd1f80-dd94-11eb-8d3b-07ad888bd0c2.png)

![5](https://user-images.githubusercontent.com/25621259/124465253-7e136d00-dd95-11eb-86e2-2e419ee6112c.png)


* Event detail - from other users view (buy ticket from event host)

  With click on button "Buy" for the selected category, users could buy tickets for that event and in that category

![6](https://user-images.githubusercontent.com/25621259/124465774-16a9ed00-dd96-11eb-8ab1-c6d5ff213636.png)

![7](https://user-images.githubusercontent.com/25621259/124465784-190c4700-dd96-11eb-9c5c-ddf939584f2f.png)


* Event detail - from others users view - tickets block (set for sell)

  With clcik on button "For Sell" user set price for how much will sold that ticket
  
![8](https://user-images.githubusercontent.com/25621259/124467003-8d93b580-dd97-11eb-8a81-40d6a0fd8035.png)

![9](https://user-images.githubusercontent.com/25621259/124467020-93899680-dd97-11eb-9a84-30ab5caef0f0.png)

  With click on button "Cancel sell" user pulls that ticket from market
 

* Event detail - from others users view - tickets block (set for bid)



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



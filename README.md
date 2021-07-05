
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
    <li><a href="#about-the-project">About The Project</a></li>
    <li>
      <a href="#hackmoney-2021">HackMoney 2021</a>
      <ul>
        <li><a href="#rarible">Rarible (Rarible Protocol)</a></li>
        <li><a href="#the-graph">The Graph (Subgraph project and query the graph)</a></li>
        <li><a href="#consensys">Consensys (Metamask)</a></li>
        <li><a href="#protocol-labs">Protocol Labs (IPFS and Pinata)</a></li>
      </ul>
    </li>
    <li><a href="#built-with">Built With</a></li>
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

![18](https://user-images.githubusercontent.com/25621259/124473094-30036700-dd9f-11eb-9eb4-8e118b8fdf1a.png)


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

  With clcik on button "For sell" user set price for how much will sold that ticket
  
![8](https://user-images.githubusercontent.com/25621259/124467003-8d93b580-dd97-11eb-8a81-40d6a0fd8035.png)

![9](https://user-images.githubusercontent.com/25621259/124467020-93899680-dd97-11eb-9a84-30ab5caef0f0.png)

  With click on button "Cancel sell" user pulls that ticket from market
 

* Event detail - from others users view - tickets block (set for bid and set bid)

  With click on button "For bid" user put that ticket on market, so he expect from other users to give it to him different offers
  
  With click on button "Cancel for bid" user pull that ticket from market

![10](https://user-images.githubusercontent.com/25621259/124467633-67bae080-dd98-11eb-8c93-706a50f3e3c0.png)

  Other users could bid for that ticket from view "For bids". Users could bid for currency (WETH for now), or for other tickets that he owns.
  
![13](https://user-images.githubusercontent.com/25621259/124468739-caf94280-dd99-11eb-8d77-b8a108e884a9.png)

![14](https://user-images.githubusercontent.com/25621259/124468741-cb91d900-dd99-11eb-93ba-948226a6fd91.png)

  When other users offers bids for ticket, user who owns that ticket could accept appropriate bid or decline
  
![15](https://user-images.githubusercontent.com/25621259/124469140-46f38a80-dd9a-11eb-8637-cc3fbcd72395.png)


* Event detail - from others views - tickets block ("For sell" view)

  In for sell view users could buy tickets for fixed amount
  
![16](https://user-images.githubusercontent.com/25621259/124471904-c040ac80-dd9d-11eb-9fa2-95eea664e804.png)
  

* Ticket market - similar view as "Ticket market" on "Event detail" form, except, this is for all events and all tickets in application

![17](https://user-images.githubusercontent.com/25621259/124472891-f2064300-dd9e-11eb-9abe-6946e40567c3.png)

* Account - basic informations about user that are stored on firebase, and connect with MetaMask address
 
![20](https://user-images.githubusercontent.com/25621259/124477475-5d064880-dda4-11eb-8f28-afb9813dd049.png)



## HackMoney 2021

This project is created for ETHGlobal hackathon "HackMoney 2021". For this project, they are used technologies and tools from four different sponsors for this hackathon:
- Rarible (Rarible Protocol)
- The Graph (Subgraph project and query the graph)
- Consensys (Metamask)
- Protocol Labs (IPFS and Pinata)


### Rarible

From this sponsor, I used API from https://api-reference.rarible.com/ , and also smart contract "NFTicketize.sol" is designed that support this API. Functions that I used:

* Lazy mint (with all additions such as IPFS uri, royalties, etc) with generate ID, so ticket (NFT) could see from Rarible portal (with all informations). Also, for image, I generate image with informations about event name, ticket category and ticket id, but in future, this could be some form of electronic ticket 

![19](https://user-images.githubusercontent.com/25621259/124475162-b15bf900-dda1-11eb-94fd-ee23ac80ee3a.png)

* Create a sell order

* Accepting order

* Create a bid order

* Prepare TX for order

* Different types of GET call from API (getOrderByHash, getSellOrdersByItem, getSellOrdersByCollection, getBidsByItem, getItemsByCreator, getItemsByCollection...)


### The Graph

For this sponsor, I create separate project NFTicketizeTheGraph to define subgraph. This project has three entities (Events, TicketCategories and Tickets), which I query in main project. 

In main project, all forms in some way (or in multiple ways) used graph queries.


### Consensys

MetaMask is core of this application, so by changing account, the data and app design are automatically adjusted to the new account. 

Of atypical functions, they are integration in some basic way with Firebase Functions, so token authorization for Firebase depends from metamask address.

From typical functions, it has been used different interactions with smart contract and signatures.
- Basic smart function call
- Function call with sent value (sending transactions)
- Signing data with "eth_signTypedData_v4" 


### Protocol Labs

For this sponsor, they are used two products:
- "js-ipfs" as "decentralized database", where are stored additional informations about "Event", "Ticket Category" and "Ticket"
- Pinata, whose role is integration with Rarible, so IPFS data such as NFT (ticket) image and NFT basic could display on Rarible portal. For this purpose, they are used next:
  * Dynamically image generation that depends from token, and upload that image with pinFileToIPFS
  * Upload additional informations about token with pinJSONToIPFS
 

## Built With

This project is built with:
* [ReactJS](https://reactjs.org/)
* [Solidity](https://soliditylang.org/)
* [Rarible](https://rarible.org/)
* [The Graph](https://thegraph.com/)
* [MetaMask] (https://metamask.io/)
* [IPFS] (https:///ipfs.io)
* [Pinata] (https://pinata.cloud/)
* [Truffle and Ganache] (https://www.trufflesuite.com/)
* [Ethers.js] (https://docs.ethers.io/v5/)
* [Firebase](https://firebase.google.com/)

<!-- GETTING STARTED -->
## Getting Started

They are two projects on main directory: NFTicketize and NFTicketizeTheGraph.

- NFTticketize is main project with front end and communication with all technologies that are used in this project
- NFTicketizeTheGraph is Subgraph project

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/StefanVitor/NFTicketize.git
   ```
2. Fill informations about keys on NFTicketize\client\src\const.js (for this file, you could contact me, because it contains private API keys)

3. Add truffle-config.js in root directories (root for NFTicketize and NFTicketizeTheGraph) if you want to truffle compile or migrate contracts

4. Go to NFTicketize/client 

5. npm start


<!-- ROADMAP -->
## Roadmap

* Development of new functionalities, such as electronic tickets as NFT image

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

Project Link: [https://github.com/StefanVitor/NFTicketize](https://github.com/StefanVitor/NFTicketize)



<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements
* [ETHGlobal](https://ethglobal.co/)
* [Rarible](https://rarible.org/) - guys, sorry for all stupid questions :) 



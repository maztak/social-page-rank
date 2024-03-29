module indexlist_addr::indexlist {
  // Errors
  const E_NOT_INITIALIZED: u64 = 1;
  const Esite_DOESNT_EXIST: u64 = 2;
  const Esite_IS_COMPLETED: u64 = 3;

  use aptos_framework::event;
  use std::string::String;
  use aptos_std::table::{Self, Table};
  use std::signer;
  use aptos_framework::account;

  struct SiteIndex {
      sites: Table<u64, Site>,
      set_site_event: event::EventHandle<Site>,
      site_counter: u64
  }

  struct Site has store, drop, copy {
    site_id: u64,
    address: address,
    domain: String,
    isEvil: bool,
  }

  public entry fun create_index(account: &signer){
    let sites_indexer = SiteIndex {
      sites: table::new(),
      set_site_event: account::new_event_handle<Site>(account),
      site_counter: 0
    };
    move_to(account, sites_indexer);
  }

  public entry fun register_site(account: &signer, domain: String) acquires SiteIndex {
    // gets the signer address
    let signer_address = signer::address_of(account);
    // assert signer has created a list
    assert!(exists<SiteIndex>(signer_address), E_NOT_INITIALIZED);

    // gets the signer address
    let signer_address = signer::address_of(account);
    // gets the SiteIndex resource
    let site_index = borrow_global_mut<SiteIndex>(signer_address);
    // increment site counter
    let counter = site_index.site_counter + 1;
    // creates a new Site
    let new_site = Site {
      site_id: counter,
      address: signer_address,
      domain,
      isEvil: false
    };
    // adds the new site into the sites table
    table::upsert(&mut site_index.sites, counter, new_site);
    // sets the site counter to be the incremented counter
    site_index.site_counter = counter;
    // fires a new site created event
    event::emit_event<Site>(
      &mut borrow_global_mut<SiteIndex>(signer_address).set_site_event,
      new_site,
    );
  }

  // TODO: enable to call by only approver(staking?)
  public entry fun approve_site(account: &signer, site_id: u64) acquires SiteIndex {    
    
  }
}
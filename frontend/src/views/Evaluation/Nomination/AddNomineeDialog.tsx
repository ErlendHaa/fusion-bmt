import * as React from 'react'
import { useApiClients, PersonDetails } from '@equinor/fusion'
import { PersonCard, Button, TextInput, SearchableDropdown, SearchableDropdownOption, Spinner, ModalSideSheet } from '@equinor/fusion-components'

import { Organization, Role, Participant } from '../../../api/models'
import { useEffect } from 'react'
import { organizationToString, roleToString } from '../../../utils/EnumToString'
import { Divider } from '@equinor/eds-core-react'

interface AddNomineeDialogProps {
    currentNominees: Array<Participant>
    open: boolean
    onCloseClick: () => void
    onNomineeSelected: (azureUniqueId: string, role: Role, organization: Organization) => void;
}

const WRITE_DELAY_MS = 1000

const AddNomineeDialog = ({ currentNominees, open, onCloseClick, onNomineeSelected }: AddNomineeDialogProps) => {
    const apiClients = useApiClients()

    const [searchQuery, setSearchQuery] = React.useState<string>("")
    const [searchResults, setSearchResults] = React.useState<PersonDetails[]>([])

    const [selectedRole, setSelectedRole] = React.useState<Role>(Role.Participant)
    const [selectedOrg, setSelectedOrg] = React.useState<Organization>(Organization.Commissioning)

    const [isSearching, setIsSearching] = React.useState<boolean>(false)

    const [orgOptions, setOrgOptions] = React.useState<SearchableDropdownOption[]>(
        Object.entries(Organization).map(([key, org]) => {
            return {
                key: key,
                title: organizationToString(org),
                isSelected: (selectedOrg === org)
            }
        })
    )

    const [roleOptions, setRoleOptions] = React.useState<SearchableDropdownOption[]>(
        Object.entries(Role).map(([key, role]) => {
            return {
                key: key,
                title: roleToString(role),
                isSelected: (selectedRole === role)
            }
        })
    )

    useEffect(() => {
        const timeout = setTimeout(() => {
            searchPersons()
        }, WRITE_DELAY_MS)
        return () => {
            clearTimeout(timeout)
        }
    }, [searchQuery])

    const updateOrgOptions = (item: SearchableDropdownOption) =>
        setOrgOptions((oldOptions) => oldOptions.map(option => {
            return {
                ...option,
                isSelected: item.key === option.key
            }
        }))

    const updateRoleOptions = (item: SearchableDropdownOption) =>
        setRoleOptions((oldOptions) => oldOptions.map(option => {
            return { ...option, isSelected: item.key === option.key }
        }))

    const searchPersons = () => {
        if (searchQuery) {
            setIsSearching(true)
            apiClients.people.searchPersons(searchQuery)
                .then((res) => {
                    setSearchResults(res.data)
                })
                .finally(() => {
                    setIsSearching(false)
                })
        }
    }

    const isParticipantNominated = (nomineeID: string): boolean => {
        let found = currentNominees.find(n => n.azureUniqueId == nomineeID)
        return found !== undefined
    }

    return (
        <ModalSideSheet
            header="Add Person"
            show={open}
            size='medium'
            onClose={onCloseClick}
            isResizable={false}
        >
            <div style={{margin: 20}}>
                <SearchableDropdown
                    options={orgOptions}
                    label="Orgnization"
                    onSelect={item => {
                        updateOrgOptions(item)
                        setSelectedOrg(Organization[item.key as keyof typeof Organization])
                    }}
                />
                <br/>
                <SearchableDropdown
                    options={roleOptions}
                    label="Role"
                    onSelect={item => {
                        updateRoleOptions(item)
                        setSelectedRole(Role[item.key as keyof typeof Role])
                    }}
                />
                <br/>
                <TextInput
                    value={searchQuery}
                    onChange={(v) => setSearchQuery(v)}
                    placeholder="Search for person..."
                    disabled={isSearching}
                />
                <br/>
                { isSearching &&
                    <div style={{justifyContent: "center"}}>
                        <Spinner />
                    </div>
                }
                { !isSearching &&
                    searchResults.map((p) => {
                        return (
                            <div style={{marginBottom: 10}} key={p.azureUniqueId}>
                                <PersonCard person={p} />
                                <Button onClick={() => {
                                    onNomineeSelected(p.azureUniqueId, selectedRole, selectedOrg)
                                }} disabled={isParticipantNominated(p.azureUniqueId)}>Add</Button>
                                <Divider />
                            </div>
                        )
                    })
                }
            </div>
        </ModalSideSheet>
    )
}

export default AddNomineeDialog
